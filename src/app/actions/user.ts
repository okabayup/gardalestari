'use server';

import { revalidatePath } from 'next/cache';
import type { PermissionId, Position, MemberWithStatus, MemberType, VerificationStatus, UserLevel, PublicUser, PublicProfile } from '@/lib/definitions';
import { sendWhatsAppMessage } from '@/services/whatsapp';
import { getWhatsappTemplate } from '@/app/actions/settings';
import { sendNotification } from './notifications';
import { awardPointsForAction } from '@/app/actions/points';
import { sendEmail } from '@/services/email';
import { getAll, getOne, getFirst, create, update, remove, uploadFile, deleteFile, now, count } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase';

const COL_USERS = 'users';
const COL_POSITIONS = 'positions';
const OFFICIAL_ACCOUNT_PHONE = process.env.SATUCONNECT_DEVICE_ID;
const ADMIN_NOTIFICATION_PHONE = '6285144904161';
const ADMIN_NOTIFICATION_EMAIL = 'halo@gardalestari.org';

// Helper: get position details by ID or username
async function getPositionDetails(positionId?: string, userName?: string): Promise<{ name: string; permissions: PermissionId[] }> {
  if (userName === 'Oka Bayu Pratama') {
    return { name: 'Sekretaris', permissions: [] };
  }
  if (!positionId) return { name: 'Anggota', permissions: [] };
  try {
    const positionData = await getOne<Position>(COL_POSITIONS, positionId);
    if (positionData) {
      return {
        name: positionData.name,
        permissions: positionData.permissions || [],
      };
    }
    return { name: 'Anggota', permissions: [] };
  } catch (error) {
    console.error("[getPositionDetails Error]", error);
    return { name: 'Anggota', permissions: [] };
  }
}

export async function getPendingVerificationCount(): Promise<number> {
  try {
    return await count(COL_USERS, {
      where: { field: 'verificationStatus', op: '==', value: 'temporary' },
    });
  } catch (error) {
    console.error("[getPendingVerificationCount Error]", error);
    throw new Error("Gagal mengambil jumlah verifikasi tertunda.");
  }
}

export async function getMembers(forPublic: boolean = false): Promise<MemberWithStatus[]> {
  try {
    const rows = await getAll<any>(COL_USERS);

    let members: MemberWithStatus[] = [];

    for (const data of rows) {
      if (data.phoneNumber === `+${OFFICIAL_ACCOUNT_PHONE}`) continue;

      if (forPublic && (
        data.isHidden === true ||
        (data.verificationStatus !== 'permanent' && data.verificationStatus !== 'manual') ||
        data.isSuspended
      )) {
        continue;
      }

      const { name: positionName, permissions } = await getPositionDetails(data.positionId, data.fullName || data.displayName);

      members.push({
        id: data.id,
        name: data.fullName || data.displayName || 'Nama Tidak Diketahui',
        username: data.username || `user_${data.id.substring(0, 5)}`,
        titlePrefix: data.titlePrefix || '',
        titlePostfix: data.titlePostfix || '',
        phoneNumber: data.phoneNumber || 'N/A',
        waNumber: data.waNumber,
        waVerified: data.waVerified || false,
        verificationStatus: data.verificationStatus,
        avatarUrl: data.avatarUrl,
        position: positionName,
        positionId: data.positionId,
        type: data.type || undefined,
        region: data.region,
        isSpecialMember: data.isSpecialMember || false,
        isHidden: data.isHidden || false,
        isSuspended: data.isSuspended || false,
        joinDate: data.createdAt || new Date().toISOString(),
        ktpImageUrl: data.ktpImageUrl,
        email: data.email,
        createdAt: data.createdAt || new Date().toISOString(),
        permissions,
        referralCode: data.referralCode,
        referralCount: data.referralCount || 0,
        referredBy: data.referredBy,
        upline: data.upline || [],
        level: data.level || 'bronze',
        deletionRequestedAt: data.deletionRequestedAt,
      });
    }

    members.sort((a, b) => {
      const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
      const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });

    return members;
  } catch (error) {
    console.error("[getMembers Error]", error);
    throw new Error("Gagal mengambil data anggota.");
  }
}

export async function createManualMember(formData: FormData) {
  const data: Record<string, any> = {};
  for (const [key, value] of formData.entries()) {
    if (key === 'photoFile' && value instanceof File) {
      data.avatarUrl = await uploadFile(value, `profile-pictures/${Date.now()}-${value.name}`);
      data.photoURL = data.avatarUrl;
    } else if (key === 'isSpecialMember' || key === 'isHidden') {
      data[key] = value === 'true';
    } else {
      data[key] = value;
    }
  }

  const username = await generateUniqueUsername(data.fullName);

  await create(COL_USERS, {
    ...data,
    username,
    verificationStatus: 'manual' as VerificationStatus,
    createdAt: now(),
    phoneNumber: `MANUAL-${Date.now()}`,
  });
  revalidatePath('/panel/members');
}

export async function resetVerificationData(userId: string) {
  if (!userId) throw new Error("ID Pengguna dibutuhkan.");

  try {
    const userData = await getOne<any>(COL_USERS, userId);
    if (!userData) throw new Error("Pengguna tidak ditemukan.");

    if (userData.ktpImageUrl) {
      try { await deleteFile(userData.ktpImageUrl); }
      catch (e) { console.warn(`[resetVerificationData] Gagal menghapus KTP lama:`, e); }
    }

    await update(COL_USERS, userId, {
      verificationStatus: 'unverified',
      nik: null,
      ktpImageUrl: null,
      submittedAt: null,
    });
    revalidatePath('/panel/members');
  } catch (error) {
    console.error(`[resetVerificationData] Error:`, error);
    throw new Error(`Gagal mereset data verifikasi: ${(error as Error).message}`);
  }
}

export async function updateMemberDetails(userId: string, formData: FormData) {
  try {
    const currentMemberData = await getOne<any>(COL_USERS, userId);
    if (!currentMemberData) throw new Error("Anggota tidak ditemukan.");

    const dataToUpdate: Record<string, any> = {};

    const positionId = formData.get('positionId') as string;
    const type = formData.get('type') as string;
    const region = formData.get('region') as string;
    const verificationStatus = formData.get('verificationStatus') as VerificationStatus;
    const isSpecialMember = formData.get('isSpecialMember') === 'true';
    const isHidden = formData.get('isHidden') === 'true';
    const isSuspended = formData.get('isSuspended') === 'true';
    const titlePrefix = formData.get('titlePrefix') as string;
    const titlePostfix = formData.get('titlePostfix') as string;
    const level = formData.get('level') as UserLevel;
    const photoFile = formData.get('photoFile') as File | null;

    if (photoFile && photoFile.size > 0) {
      console.log("[updateMemberDetails] Uploading new profile picture...");
      if (currentMemberData.avatarUrl) {
        try { await deleteFile(currentMemberData.avatarUrl); }
        catch (e) { console.warn("[updateMemberDetails Warn] Old photo not found, skipping deletion.", e); }
      }
      dataToUpdate.avatarUrl = await uploadFile(photoFile, `profile-pictures/${userId}-${photoFile.name}`);
    }

    dataToUpdate.titlePrefix = titlePrefix;
    dataToUpdate.titlePostfix = titlePostfix;
    dataToUpdate.isSpecialMember = isSpecialMember;
    dataToUpdate.isHidden = isHidden;
    dataToUpdate.isSuspended = isSuspended;
    dataToUpdate.verificationStatus = verificationStatus;
    dataToUpdate.level = level;

    dataToUpdate.positionId = positionId === 'no-position' ? null : positionId;
    dataToUpdate.type = type === 'no-type' ? null : type;
    dataToUpdate.region = (type === 'daerah' && region) ? region : null;

    await update(COL_USERS, userId, dataToUpdate);

    const memberPhoneNumber = currentMemberData.waNumber;
    const memberName = currentMemberData.fullName;
    const memberEmail = currentMemberData.email;

    if (verificationStatus && verificationStatus !== currentMemberData.verificationStatus) {
      let templateId: 'kta_activated' | 'member_verification_rejected' | null = null;
      let emailSubject = '';
      let notificationPayload: { title: string; body: string } | null = null;

      if (verificationStatus === 'permanent' && !currentMemberData.referralPointsAwarded) {
        templateId = 'kta_activated';
        emailSubject = 'Selamat! KTA Garda Lestari Anda Telah Aktif';
        notificationPayload = { title: 'Verifikasi Berhasil!', body: 'Selamat! Akun Anda telah diverifikasi secara permanen.' };

        if (currentMemberData.upline && currentMemberData.upline.length > 0) {
          for (let i = 0; i < currentMemberData.upline.length; i++) {
            const referrerId = currentMemberData.upline[i];
            const referralLevel = i + 1;
            try {
              await awardPointsForAction('referral', referrerId, `Bonus rujukan Lvl. ${referralLevel} dari ${memberName}`, referralLevel);
            } catch (e) {
              console.error(`[Referral Points Error] Gagal memberikan poin Level ${referralLevel} ke ${referrerId}`, e);
            }
          }
          await update(COL_USERS, userId, { referralPointsAwarded: true });
        }
      } else if (verificationStatus === 'rejected') {
        templateId = 'member_verification_rejected';
        emailSubject = 'Pembaruan Status Verifikasi Garda Lestari Anda';
        notificationPayload = { title: 'Verifikasi Ditolak', body: 'Pengajuan verifikasi Anda ditolak. Silakan periksa kembali data Anda.' };
      }

      if (templateId) {
        const template = await getWhatsappTemplate(templateId);
        const message = template.message.replace('{namaPengguna}', memberName);
        if (template.isActive) {
          if (memberPhoneNumber) await sendWhatsAppMessage(memberPhoneNumber, message);
          if (memberEmail) await sendEmail({ to: memberEmail, subject: emailSubject, text: message });
        }
      }

      if (notificationPayload) {
        await sendNotification(
          { ...notificationPayload, link: '/profile/me' },
          { type: 'users', userIds: [userId] }
        );
      }
    }

    const newPositionId = dataToUpdate.positionId || null;
    const oldPositionId = currentMemberData.positionId || null;

    if (newPositionId !== oldPositionId) {
      const { name: newPositionName } = await getPositionDetails(newPositionId ?? undefined, memberName);

      await sendNotification(
        { title: 'Jabatan Diperbarui', body: `Selamat! Jabatan Anda telah diperbarui menjadi ${newPositionName}.`, link: '/profile/me' },
        { type: 'users', userIds: [userId] }
      );

      const template = await getWhatsappTemplate('member_position_updated');
      const message = template.message
        .replace('{namaPengguna}', memberName)
        .replace('{namaJabatan}', newPositionName);

      if (template.isActive && memberPhoneNumber) await sendWhatsAppMessage(memberPhoneNumber, message);
      if (memberEmail) await sendEmail({ to: memberEmail, subject: 'Pembaruan Jabatan di Garda Lestari', text: message });
    }

    revalidatePath('/panel/members');
    revalidatePath('/members');
  } catch (error) {
    console.error("[updateMemberDetails Error]", error);
    throw new Error(`Gagal memperbarui detail anggota: ${(error as Error).message}`);
  }
}

export async function getUserByUid(uid: string): Promise<(MemberWithStatus & { email?: string; waNumber?: string }) | null> {
  if (!uid) return null;
  try {
    const data = await getOne<any>(COL_USERS, uid);
    if (!data) return null;

    const { name: positionName, permissions } = await getPositionDetails(data.positionId, data.fullName || data.displayName);

    return {
      id: data.id,
      name: data.fullName || data.displayName || 'Nama Tidak Diketahui',
      username: data.username,
      email: data.email,
      avatarUrl: data.avatarUrl,
      phoneNumber: data.phoneNumber || 'N/A',
      verificationStatus: data.verificationStatus || 'unverified',
      position: positionName,
      positionId: data.positionId,
      type: data.type,
      region: data.region,
      isSpecialMember: data.isSpecialMember,
      isSuspended: data.isSuspended || false,
      joinDate: data.createdAt || new Date().toISOString(),
      permissions,
      waNumber: data.waNumber,
      waVerified: data.waVerified || false,
      instagram: data.instagram,
      linkedin: data.linkedin,
      skills: data.skills || [],
      interests: data.interests || [],
      referralCode: data.referralCode,
      referralCount: data.referralCount || 0,
      greenPoints: data.greenPoints || 0,
    };
  } catch (error) {
    console.error("[getUserByUid Error]", error);
    return null;
  }
}

export async function getUserByUsername(username: string): Promise<PublicProfile | null> {
  if (!username) return null;
  try {
    const data = await getFirst<any>(COL_USERS, {
      where: { field: 'username', op: '==', value: username },
    });
    if (!data) return null;

    const { name: positionName } = await getPositionDetails(data.positionId, data.fullName || data.displayName);

    return {
      id: data.id,
      name: data.fullName || data.displayName || 'Nama Tidak Diketahui',
      username: data.username,
      avatarUrl: data.avatarUrl,
      phoneNumber: data.phoneNumber || 'N/A',
      verificationStatus: data.verificationStatus || 'unverified',
      position: positionName,
      positionId: data.positionId,
      type: data.type,
      region: data.region,
      joinDate: data.createdAt || new Date().toISOString(),
      permissions: [],
      instagram: data.instagram,
      linkedin: data.linkedin,
      skills: data.skills || [],
      interests: data.interests || [],
    };
  } catch (error) {
    console.error("[getUserByUsername Error]", error);
    return null;
  }
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  if (!username) return false;
  try {
    const row = await getFirst(COL_USERS, {
      where: { field: 'username', op: '==', value: username },
    });
    return row !== null;
  } catch (error) {
    console.error("[checkUsernameExists Error]", error);
    return true;
  }
}

export async function generateUniqueUsername(fullName: string): Promise<string> {
  try {
    const baseUsername = fullName.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15) || 'user';
    let username = baseUsername;

    while (true) {
      const exists = await checkUsernameExists(username);
      if (!exists) return username;
      username = `${baseUsername}${Math.floor(Math.random() * 1000)}`;
    }
  } catch (error) {
    console.error("[generateUniqueUsername Error]", error);
    throw new Error("Gagal membuat nama pengguna unik.");
  }
}

export async function searchUsers(searchQuery: string, limitCount: number = 5): Promise<PublicUser[]> {
  if (!searchQuery) return [];
  const searchTerm = searchQuery.toLowerCase();

  try {
    // Fetch all users and filter client-side (simpler than JSONB range queries)
    const allUsers = await getAll<any>(COL_USERS);
    const usersMap = new Map<string, PublicUser>();

    for (const data of allUsers) {
      const username = (data.username || '').toLowerCase();
      const fullName = (data.fullName || data.displayName || '').toLowerCase();
      if (username.includes(searchTerm) || fullName.includes(searchTerm)) {
        usersMap.set(data.id, {
          id: data.id,
          username: data.username,
          fullName: data.fullName || data.displayName,
          avatarUrl: data.avatarUrl,
        });
      }
      if (usersMap.size >= limitCount) break;
    }

    return Array.from(usersMap.values());
  } catch (error) {
    console.error("[searchUsers Error]", error);
    return [];
  }
}

const normalizePhoneNumber = (phone: string): string => {
  let normalized = phone.replace(/\D/g, '');
  if (normalized.startsWith('0')) {
    normalized = '62' + normalized.substring(1);
  } else if (!normalized.startsWith('62')) {
    normalized = '62' + normalized;
  }
  return normalized;
};

export async function saveWaNumber(userId: string, waNumber: string) {
  try {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const formattedNumber = normalizePhoneNumber(waNumber);

    // Merge update (upsert) existing user doc
    const existing = await getOne<any>(COL_USERS, userId);
    if (existing) {
      await update(COL_USERS, userId, { waNumber: formattedNumber, waOtp: otp, waVerified: false });
    } else {
      await create(COL_USERS, { waNumber: formattedNumber, waOtp: otp, waVerified: false }, userId);
    }

    const result = await sendWhatsAppMessage(formattedNumber, `Kode verifikasi Garda Lestari Anda adalah: ${otp}`);
    if (!result.success) throw new Error(result.error || 'Gagal mengirim OTP dari layanan WhatsApp.');
    return result;
  } catch (error) {
    console.error(`[saveWaNumber Error]:`, error);
    throw new Error((error as Error).message);
  }
}

export async function verifyWaNumber(userId: string, otp: string): Promise<boolean> {
  try {
    const userData = await getOne<any>(COL_USERS, userId);
    if (userData && userData.waOtp === otp) {
      await update(COL_USERS, userId, { waVerified: true, waOtp: null });
      return true;
    }
    return false;
  } catch (error) {
    console.error("[verifyWaNumber Error]", error);
    throw new Error("Gagal memverify nomor WhatsApp.");
  }
}

export async function updateUserProfile(userId: string, data: { username?: string; photoFile?: File; instagram?: string; linkedin?: string; skills?: string[]; interests?: string[] }) {
  try {
    const dataToUpdate: Record<string, any> = {};

    if (data.photoFile) {
      console.log("[updateUserProfile] Uploading new profile picture...");
      dataToUpdate.avatarUrl = await uploadFile(data.photoFile, `profile-pictures/${userId}`);
      console.log("[updateUserProfile] Image uploaded:", dataToUpdate.avatarUrl);
    }

    if (data.username) {
      const currentUser = await getOne<any>(COL_USERS, userId);
      const currentUsername = currentUser?.username;
      if (data.username !== currentUsername) {
        const isAvailable = !(await checkUsernameExists(data.username));
        if (!isAvailable) throw new Error('Nama pengguna tersebut sudah digunakan.');
        dataToUpdate.username = data.username;
      }
    }

    if (data.instagram) dataToUpdate.instagram = data.instagram;
    if (data.linkedin) dataToUpdate.linkedin = data.linkedin;
    if (data.skills) dataToUpdate.skills = data.skills;
    if (data.interests) dataToUpdate.interests = data.interests;

    if (Object.keys(dataToUpdate).length > 0) {
      await update(COL_USERS, userId, dataToUpdate);
    }

    revalidatePath(`/profile/me`);
    revalidatePath(`/profile/${data.username}`);
  } catch (error) {
    console.error("[updateUserProfile Error]", error);
    throw new Error(`Gagal memperbarui profil: ${(error as Error).message}`);
  }
}

export async function processVerificationSubmission(
  userId: string,
  data: { fullName: string; nik: string; ktpDataUrl: string; photoDataUrl?: string; waNumber: string }
) {
  try {
    // Check NIK uniqueness
    const existingNik = await getFirst(COL_USERS, {
      where: { field: 'nik', op: '==', value: data.nik },
    });
    if (existingNik && (existingNik as any).id !== userId) {
      throw new Error("NIK ini sudah terdaftar pada akun lain.");
    }

    const ktpBuffer = Buffer.from(data.ktpDataUrl.split(',')[1], 'base64');
    const ktpImageUrl = await uploadFile(ktpBuffer, `kyc/${userId}/ktp.jpg`);

    let newPhotoURL: string | null = null;
    if (data.photoDataUrl) {
      const photoBuffer = Buffer.from(data.photoDataUrl.split(',')[1], 'base64');
      newPhotoURL = await uploadFile(photoBuffer, `profile-pictures/${userId}`);
    }

    const username = await generateUniqueUsername(data.fullName);
    const formattedWaNumber = normalizePhoneNumber(data.waNumber);

    const verificationData: Record<string, any> = {
      fullName: data.fullName,
      displayName: data.fullName,
      username,
      nik: data.nik,
      waNumber: formattedWaNumber,
      waVerified: true,
      verificationStatus: 'temporary' as VerificationStatus,
      ktpImageUrl,
      submittedAt: now(),
    };

    if (newPhotoURL) {
      verificationData.avatarUrl = newPhotoURL;
      verificationData.photoURL = newPhotoURL;
    }

    // Upsert user document
    const existingUser = await getOne<any>(COL_USERS, userId);
    if (existingUser) {
      await update(COL_USERS, userId, verificationData);
    } else {
      await create(COL_USERS, verificationData, userId);
    }

    // Update Supabase Auth user (replaces Firebase Admin auth.updateUser)
    try {
      await supabaseAdmin.auth.admin.updateUserById(userId, {
        user_metadata: {
          displayName: data.fullName,
          ...(newPhotoURL && { photoURL: newPhotoURL }),
        },
      });
    } catch (e) {
      console.warn("[processVerificationSubmission] Could not update Supabase Auth user metadata:", e);
    }

    return { success: true };
  } catch (error) {
    console.error("[processVerificationSubmission Error]", error);
    throw new Error(`Gagal memproses pengajuan: ${(error as Error).message}`);
  }
}

export async function getUserUplineStructure(userId: string): Promise<Record<string, number>> {
  const structure: Record<string, number> = {};

  try {
    const rows = await getAll<any>(COL_USERS, {
      where: { field: 'upline', op: 'array-contains', value: userId },
    });

    rows.forEach(data => {
      const upline: string[] = data.upline || [];
      const index = upline.indexOf(userId);
      if (index !== -1) {
        const levelKey = `Level ${index + 1}`;
        structure[levelKey] = (structure[levelKey] || 0) + 1;
      }
    });

    const userData = await getOne<any>(COL_USERS, userId);
    if (userData) {
      structure['Level 1'] = userData.referralCount || 0;
    }
  } catch (error) {
    console.error('[getUserUplineStructure Error]', error);
  }

  return structure;
}

export async function requestDataDeletion(userId: string) {
  if (!userId) throw new Error("ID pengguna dibutuhkan.");

  const userData = await getOne<any>(COL_USERS, userId);
  if (!userData) throw new Error("Pengguna tidak ditemukan.");

  await update(COL_USERS, userId, { deletionRequestedAt: now() });

  const message = `🚨 PERMINTAAN HAPUS DATA 🚨\n\nPengguna:\n- Nama: ${userData.fullName}\n- Username: ${userData.username}\n- UID: ${userId}\n\nTelah mengajukan permintaan penghapusan data. Mohon tinjau di panel admin.`;

  try { await sendWhatsAppMessage(ADMIN_NOTIFICATION_PHONE, message); }
  catch (e) { console.error("Failed to send WhatsApp alert for deletion request:", e); }
  try { await sendEmail({ to: ADMIN_NOTIFICATION_EMAIL, subject: `Permintaan Hapus Data: ${userData.fullName}`, text: message }); }
  catch (e) { console.error("Failed to send email alert for deletion request:", e); }

  revalidatePath('/panel/members');
}

export async function deleteUserAccount(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Delete from Supabase Auth (replaces Firebase Admin auth.deleteUser)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) throw authError;

    await remove(COL_USERS, userId);
    revalidatePath('/panel/members');

    return { success: true };
  } catch (error) {
    console.error(`[deleteUserAccount Error] Failed to delete user ${userId}:`, error);
    return { success: false, error: (error as Error).message };
  }
}

export async function getUserByWaNumber(waNumber: string): Promise<PublicUser | null> {
  if (!waNumber) return null;
  try {
    const data = await getFirst<any>(COL_USERS, {
      where: { field: 'waNumber', op: '==', value: waNumber },
    });
    if (!data) return null;
    return {
      id: data.id,
      username: data.username,
      fullName: data.fullName,
      avatarUrl: data.avatarUrl,
    };
  } catch (error) {
    console.error("[getUserByWaNumber Error]", error);
    return null;
  }
}

export async function suspendUser(userId: string, reason: string): Promise<void> {
  if (!userId) throw new Error('ID Pengguna dibutuhkan.');

  const userData = await getOne<any>(COL_USERS, userId);
  if (!userData) throw new Error('Pengguna tidak ditemukan.');

  await update(COL_USERS, userId, { isSuspended: true, suspensionReason: reason });

  revalidatePath('/panel/members');
  revalidatePath(`/profile/${userData.username}`);
}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           