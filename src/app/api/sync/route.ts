import { NextResponse } from 'next/server';
import { db, ensureDbInitialized } from '@/db';
import { syncDevices, userSyncData } from '@/db/schema';
import { eq } from 'drizzle-orm';

/**
 * GET /api/sync?code=NH-XXXXX
 * Pulls the latest cloud synchronization state for the given sync code
 */
export async function GET(request: Request) {
  try {
    await ensureDbInitialized();

    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code')?.trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã đồng bộ (code).' },
        { status: 400 }
      );
    }

    // Verify device exists
    const device = await db
      .select()
      .from(syncDevices)
      .where(eq(syncDevices.syncCode, code))
      .limit(1);

    if (device.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Mã đồng bộ không tồn tại hoặc không hợp lệ.' },
        { status: 404 }
      );
    }

    // Fetch latest user sync data
    const syncData = await db
      .select()
      .from(userSyncData)
      .where(eq(userSyncData.syncCode, code))
      .limit(1);

    if (syncData.length === 0) {
      return NextResponse.json({
        success: true,
        hasData: false,
        syncCode: code,
        message: 'Chưa có dữ liệu học tập nào được tải lên cho mã này.',
      });
    }

    const row = syncData[0];
    return NextResponse.json({
      success: true,
      hasData: true,
      syncCode: code,
      data: {
        cards: JSON.parse(row.cardsData || '{}'),
        stats: JSON.parse(row.statsData || '{}'),
        kanjiStatus: JSON.parse(row.kanjiStatus || '{}'),
        vocabProgress: JSON.parse(row.vocabProgress || '{}'),
        preferences: JSON.parse(row.preferences || '{}'),
      },
      updatedAt: row.updatedAt,
    });
  } catch (error: any) {
    console.error('Sync pull error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi tải dữ liệu đồng bộ' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sync
 * Pushes local progress to the cloud database
 */
export async function POST(request: Request) {
  try {
    await ensureDbInitialized();

    const body = await request.json();
    const {
      syncCode,
      cards,
      stats,
      kanjiStatus,
      vocabProgress,
      preferences,
      deviceName,
      updatedAt,
    } = body;

    const code = syncCode?.trim().toUpperCase();
    if (!code) {
      return NextResponse.json(
        { success: false, error: 'Thiếu mã đồng bộ (syncCode).' },
        { status: 400 }
      );
    }

    const now = Date.now();
    const clientTimestamp = updatedAt || now;

    // Check device existence or auto-register if valid format (NH-XXXXX)
    const device = await db
      .select()
      .from(syncDevices)
      .where(eq(syncDevices.syncCode, code))
      .limit(1);

    if (device.length === 0) {
      await db.insert(syncDevices).values({
        syncCode: code,
        deviceName: deviceName || 'Thiết bị cá nhân',
        createdAt: now,
        lastSyncAt: now,
      });
    } else {
      await db
        .update(syncDevices)
        .set({ lastSyncAt: now })
        .where(eq(syncDevices.syncCode, code));
    }

    // Check existing data
    const existing = await db
      .select()
      .from(userSyncData)
      .where(eq(userSyncData.syncCode, code))
      .limit(1);

    const cardsJson = JSON.stringify(cards || {});
    const statsJson = JSON.stringify(stats || {});
    const kanjiJson = JSON.stringify(kanjiStatus || {});
    const vocabJson = JSON.stringify(vocabProgress || {});
    const prefsJson = JSON.stringify(preferences || {});

    if (existing.length === 0) {
      await db.insert(userSyncData).values({
        syncCode: code,
        cardsData: cardsJson,
        statsData: statsJson,
        kanjiStatus: kanjiJson,
        vocabProgress: vocabJson,
        preferences: prefsJson,
        version: 1,
        updatedAt: clientTimestamp,
      });
    } else {
      await db
        .update(userSyncData)
        .set({
          cardsData: cardsJson,
          statsData: statsJson,
          kanjiStatus: kanjiJson,
          vocabProgress: vocabJson,
          preferences: prefsJson,
          updatedAt: clientTimestamp,
        })
        .where(eq(userSyncData.syncCode, code));
    }

    return NextResponse.json({
      success: true,
      syncCode: code,
      updatedAt: clientTimestamp,
      message: 'Đồng bộ dữ liệu lên đám mây thành công.',
    });
  } catch (error: any) {
    console.error('Sync push error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Lỗi khi lưu dữ liệu đồng bộ' },
      { status: 500 }
    );
  }
}
