import { NextResponse } from 'next/server';
import { db, client, ensureDbInitialized } from '@/db';
import { syncDevices } from '@/db/schema';
import { eq } from 'drizzle-orm';

function generateRandomCode(): string {
  const digits = Math.floor(10000 + Math.random() * 90000); // 5 digits
  return `NH-${digits}`;
}

export async function POST(request: Request) {
  try {
    await ensureDbInitialized();

    let body: any = {};
    try {
      body = await request.json();
    } catch {}

    const deviceName = body.deviceName || 'Thiết bị mới';
    const now = Date.now();

    // Generate unique code
    let code = generateRandomCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await db
        .select()
        .from(syncDevices)
        .where(eq(syncDevices.syncCode, code))
        .limit(1);

      if (existing.length === 0) break;
      code = generateRandomCode();
      attempts++;
    }

    // Register device
    await db.insert(syncDevices).values({
      syncCode: code,
      deviceName,
      createdAt: now,
      lastSyncAt: now,
    });

    return NextResponse.json({
      success: true,
      syncCode: code,
      createdAt: now,
    });
  } catch (error: any) {
    console.error('Error generating sync code:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tạo mã đồng bộ' },
      { status: 500 }
    );
  }
}
