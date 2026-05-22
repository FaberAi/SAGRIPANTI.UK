import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserId } from "@/lib/session";
import { sendTelegram } from "@/lib/telegram";

// Profilo dell'utente attualmente loggato.
export async function GET(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, name: true, isAdmin: true, telegramChatId: true },
  });
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  return NextResponse.json(user);
}

/**
 * Aggiorna le impostazioni di notifica dell'utente: collega o scollega il
 * proprio chat ID Telegram. Se collegato, invia subito un messaggio di prova
 * così l'utente verifica che il bot riesca a scrivergli.
 */
export async function PATCH(req: NextRequest) {
  const userId = await getUserId(req);
  if (!userId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  let body: { telegramChatId?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body non valido" }, { status: 400 });
  }

  const raw = (body.telegramChatId ?? "").toString().trim();
  // Telegram usa ID numerici (negativi per i gruppi): si rifiuta tutto il resto.
  if (raw && !/^-?\d+$/.test(raw)) {
    return NextResponse.json(
      { error: "Chat ID non valido: dev'essere un numero" },
      { status: 400 }
    );
  }
  const chatId = raw || null;

  const user = await prisma.user.update({
    where: { id: userId },
    data: { telegramChatId: chatId },
    select: { id: true, email: true, name: true, isAdmin: true, telegramChatId: true },
  });

  let telegramTest: { sent: boolean; error?: string } = { sent: false };
  if (chatId) {
    const res = await sendTelegram(
      chatId,
      "✅ <b>Telegram collegato</b>\nRiceverai qui i segnali dei tuoi bot.\n\nSAGRIPANTI.UK"
    );
    telegramTest = res.ok ? { sent: true } : { sent: false, error: res.error };
  }

  return NextResponse.json({ ...user, telegramTest });
}
