'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { bottleSchema, consumeBottleSchema, editBottleSchema } from '@/lib/validations/bottle';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createBottle(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Parse and validate form data
  const rawData = {
    wineName: formData.get('wineName'),
    vintage: formData.get('vintage') || null,
    producerName: formData.get('producerName'),
    wineType: formData.get('wineType'),
    country: formData.get('country'),
    region: formData.get('region'),
    subRegion: formData.get('subRegion') || '',
    primaryGrape: formData.get('primaryGrape') || '',
    quantity: formData.get('quantity') || 1,
    purchasePrice: formData.get('purchasePrice') || undefined,
    currency: formData.get('currency') || 'USD',
    purchaseDate: formData.get('purchaseDate') || undefined,
    purchaseLocation: formData.get('purchaseLocation') || '',
    storageLocation: formData.get('storageLocation') || '',
    personalNotes: formData.get('personalNotes') || '',
    tags: formData.get('tags') ? JSON.parse(formData.get('tags') as string) : [],
    acquisitionMethod: formData.get('acquisitionMethod') || 'purchased',
  };

  const validatedData = bottleSchema.parse(rawData);

  try {
    // First, try to find existing wine or create new one
    const wine = await prisma.wine.create({
      data: {
        name: validatedData.wineName,
        fullName: `${validatedData.producerName} ${validatedData.wineName} ${validatedData.vintage || 'NV'}`,
        vintage: validatedData.vintage || null,
        producerName: validatedData.producerName,
        wineType: validatedData.wineType,
        country: validatedData.country,
        region: validatedData.region,
        subRegion: validatedData.subRegion || null,
        primaryGrape: validatedData.primaryGrape || null,
      },
    });

    // Create the bottle
    const bottle = await prisma.bottle.create({
      data: {
        userId: session.user.id,
        wineId: wine.id,
        quantity: validatedData.quantity,
        purchasePrice: validatedData.purchasePrice ? String(validatedData.purchasePrice) : null,
        currency: validatedData.currency,
        purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null,
        purchaseLocation: validatedData.purchaseLocation || null,
        storageLocation: validatedData.storageLocation || null,
        personalNotes: validatedData.personalNotes || null,
        tags: validatedData.tags,
        acquisitionMethod: validatedData.acquisitionMethod,
      },
      include: {
        wine: true,
      },
    });

    revalidatePath('/cellar');
    revalidatePath('/dashboard');

    return { success: true, bottleId: bottle.id };
  } catch (error) {
    console.error('Error creating bottle:', error);
    throw new Error('Failed to create bottle');
  }
}

export async function getBottles(filters?: {
  wineType?: string;
  region?: string;
  status?: string;
  search?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const where: any = {
    userId: session.user.id,
  };

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.wineType || filters?.region || filters?.search) {
    where.wine = {};

    if (filters.wineType) {
      where.wine.wineType = filters.wineType;
    }

    if (filters.region) {
      where.wine.region = {
        contains: filters.region,
        mode: 'insensitive',
      };
    }

    if (filters.search) {
      where.wine.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { producerName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }
  }

  const bottles = await prisma.bottle.findMany({
    where,
    include: {
      wine: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Convert Decimal to string for all bottles
  return bottles.map(bottle => ({
    ...bottle,
    purchasePrice: bottle.purchasePrice ? bottle.purchasePrice.toString() : null,
    wine: bottle.wine ? {
      ...bottle.wine,
      alcoholPercentage: bottle.wine.alcoholPercentage ? bottle.wine.alcoholPercentage.toString() : null,
    } : null,
  }));
}

export async function getBottle(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const bottle = await prisma.bottle.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    include: {
      wine: true,
      consumptionLogs: {
        orderBy: {
          consumedDate: 'desc',
        },
      },
    },
  });

  if (!bottle) return null;

  // Convert Decimal to string
  return {
    ...bottle,
    purchasePrice: bottle.purchasePrice ? bottle.purchasePrice.toString() : null,
    wine: bottle.wine ? {
      ...bottle.wine,
      alcoholPercentage: bottle.wine.alcoholPercentage ? bottle.wine.alcoholPercentage.toString() : null,
    } : null,
  };
}

export async function updateBottle(data: any) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const validatedData = editBottleSchema.parse(data);

  // Verify ownership
  const existingBottle = await prisma.bottle.findFirst({
    where: {
      id: validatedData.id,
      userId: session.user.id,
    },
  });

  if (!existingBottle) {
    throw new Error('Bottle not found');
  }

  const updateData: any = {};

  if (validatedData.quantity !== undefined) updateData.quantity = validatedData.quantity;
  if (validatedData.purchasePrice !== undefined) updateData.purchasePrice = String(validatedData.purchasePrice);
  if (validatedData.currency) updateData.currency = validatedData.currency;
  if (validatedData.purchaseDate) updateData.purchaseDate = new Date(validatedData.purchaseDate);
  if (validatedData.purchaseLocation !== undefined) updateData.purchaseLocation = validatedData.purchaseLocation;
  if (validatedData.storageLocation !== undefined) updateData.storageLocation = validatedData.storageLocation;
  if (validatedData.personalNotes !== undefined) updateData.personalNotes = validatedData.personalNotes;
  if (validatedData.tags) updateData.tags = validatedData.tags;
  if (validatedData.rating !== undefined) updateData.rating = validatedData.rating;

  const bottle = await prisma.bottle.update({
    where: { id: validatedData.id },
    data: updateData,
    include: {
      wine: true,
    },
  });

  revalidatePath('/cellar');
  revalidatePath(`/bottle/${validatedData.id}`);

  return { success: true, bottle };
}

export async function deleteBottle(id: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  // Verify ownership
  const bottle = await prisma.bottle.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  });

  if (!bottle) {
    throw new Error('Bottle not found');
  }

  await prisma.bottle.delete({
    where: { id },
  });

  revalidatePath('/cellar');
  revalidatePath('/dashboard');

  redirect('/cellar');
}

export async function consumeBottle(data: any) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const validatedData = consumeBottleSchema.parse(data);

  // Verify ownership and get bottle
  const bottle = await prisma.bottle.findFirst({
    where: {
      id: validatedData.bottleId,
      userId: session.user.id,
    },
    include: {
      wine: true,
    },
  });

  if (!bottle) {
    throw new Error('Bottle not found');
  }

  // Create consumption log
  await prisma.consumptionLog.create({
    data: {
      bottleId: validatedData.bottleId,
      userId: session.user.id,
      wineId: bottle.wineId!,
      consumedDate: new Date(validatedData.consumedDate),
      quantityConsumed: validatedData.quantityConsumed,
      rating: validatedData.rating,
      tastingNotes: validatedData.tastingNotes,
      occasion: validatedData.occasion,
      companions: validatedData.companions,
      location: validatedData.location,
    },
  });

  // Update bottle quantity and status
  const newQuantity = bottle.quantity - validatedData.quantityConsumed;

  await prisma.bottle.update({
    where: { id: validatedData.bottleId },
    data: {
      quantity: newQuantity,
      status: newQuantity === 0 ? 'consumed' : 'in_cellar',
      consumedDate: newQuantity === 0 ? new Date(validatedData.consumedDate) : null,
      rating: validatedData.rating || bottle.rating,
    },
  });

  revalidatePath('/cellar');
  revalidatePath(`/bottle/${validatedData.bottleId}`);
  revalidatePath('/dashboard');

  return { success: true };
}
