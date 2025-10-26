'use server';

import { auth } from '@/auth';
import { prisma } from '@/lib/prisma';
import { bottleSchema, consumeBottleSchema, editBottleSchema } from '@/lib/validations/bottle';
import { findBestWineMatch } from '@/lib/utils/wine-matching';
import { generateWineDescription } from '@/lib/ai/wine-description';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import type { Wine } from '@/lib/generated/prisma';

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
    existingWineId: formData.get('existingWineId') || undefined,
    status: formData.get('status') || 'in_cellar',
  };

  const labelImageUrl = formData.get('labelImageUrl') as string | null;

  const validatedData = bottleSchema.parse(rawData);

  try {
    let wineRecord: Wine | null = null;
    let createdNewWine = false;

    if (validatedData.existingWineId) {
      wineRecord = await prisma.wine.findUnique({ where: { id: validatedData.existingWineId } });
      if (!wineRecord) {
        throw new Error('Selected wine could not be found');
      }

      if (labelImageUrl && !wineRecord.primaryLabelImageUrl) {
        wineRecord = await prisma.wine.update({
          where: { id: wineRecord.id },
          data: { primaryLabelImageUrl: labelImageUrl },
        });
      }
    } else {
      console.log('Searching for matching wine...');
      const candidates = await prisma.wine.findMany({
        where: {
          producerName: {
            contains: validatedData.producerName,
            mode: 'insensitive',
          },
        },
        take: 20,
      });

      const match = findBestWineMatch(
        {
          name: validatedData.wineName,
          producerName: validatedData.producerName,
          vintage: validatedData.vintage,
        },
        candidates
      );

      if (match) {
        console.log(`Found matching wine: ${match.wine.name} (${Math.round(match.score * 100)}% match)`);
        wineRecord = await prisma.wine.findUnique({ where: { id: match.wine.id } });
        if (!wineRecord) {
          throw new Error('Matched wine could not be retrieved');
        }

        if (labelImageUrl && !wineRecord.primaryLabelImageUrl) {
          wineRecord = await prisma.wine.update({
            where: { id: wineRecord.id },
            data: { primaryLabelImageUrl: labelImageUrl },
          });
        }
      } else {
        console.log('No match found, creating new wine');
        wineRecord = await prisma.wine.create({
          data: {
            name: validatedData.wineName,
            fullName: `${validatedData.producerName} ${validatedData.wineName} ${validatedData.vintage || 'NV'}`,
            vintage: validatedData.vintage ?? null,
            producerName: validatedData.producerName,
            wineType: validatedData.wineType,
            country: validatedData.country,
            region: validatedData.region,
            subRegion: validatedData.subRegion || null,
            primaryGrape: validatedData.primaryGrape || null,
            primaryLabelImageUrl: labelImageUrl || null,
          },
        });
        createdNewWine = true;
      }
    }

    if (!wineRecord) {
      throw new Error('Could not determine which wine this bottle belongs to');
    }

    const bottle = await prisma.bottle.create({
      data: {
        userId: session.user.id,
        wineId: wineRecord.id,
        quantity: validatedData.quantity,
        purchasePrice: validatedData.purchasePrice ? String(validatedData.purchasePrice) : null,
        currency: validatedData.currency,
        purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : null,
        purchaseLocation: validatedData.purchaseLocation || null,
        storageLocation: validatedData.storageLocation || null,
        personalNotes: validatedData.personalNotes || null,
        labelImageUrl: labelImageUrl || null,
        tags: validatedData.tags,
        acquisitionMethod: validatedData.acquisitionMethod,
        status: validatedData.status,
      },
      include: {
        wine: true,
      },
    });

    if (createdNewWine) {
      const generated = await generateWineDescription({
        name: wineRecord.name,
        producerName: wineRecord.producerName,
        wineType: wineRecord.wineType ? wineRecord.wineType.toString() : undefined,
        vintage: wineRecord.vintage,
        country: wineRecord.country,
        region: wineRecord.region,
        subRegion: wineRecord.subRegion,
        primaryGrape: wineRecord.primaryGrape,
      });

      if (generated) {
        await prisma.wine.update({
          where: { id: wineRecord.id },
          data: {
            description: generated.description,
            aiGeneratedSummary: generated.summary,
          },
        });
      }
    }

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

  if (filters?.status && filters.status !== 'all') {
    if (filters.status === 'watchlist') {
      where.status = {
        in: ['gifted', 'other'],
      };
    } else {
      where.status = filters.status;
    }
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
    labelImageUrl: bottle.labelImageUrl,
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
  if (validatedData.labelImageUrl !== undefined) updateData.labelImageUrl = validatedData.labelImageUrl;
  if (validatedData.status) updateData.status = validatedData.status;

  const bottle = await prisma.bottle.update({
    where: { id: validatedData.id },
    data: updateData,
    include: {
      wine: true,
    },
  });

  revalidatePath('/cellar');
  revalidatePath(`/bottle/${validatedData.id}`);

  // Convert Decimal to string
  const serializedBottle = {
    ...bottle,
    purchasePrice: bottle.purchasePrice ? bottle.purchasePrice.toString() : null,
    wine: bottle.wine ? {
      ...bottle.wine,
      alcoholPercentage: bottle.wine.alcoholPercentage ? bottle.wine.alcoholPercentage.toString() : null,
    } : null,
  };

  return { success: true, bottle: serializedBottle };
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

export async function createBottleFromScan(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error('Unauthorized');
  }

  const existingWineId = formData.get('existingWineId');
  const imageUrlEntry = formData.get('imageUrl');
  const imageUrl = typeof imageUrlEntry === 'string' && imageUrlEntry.length > 0 ? imageUrlEntry : null;

  // Parse wine data
  const wineData = {
    wineName: formData.get('wineName') as string,
    vintage: formData.get('vintage') as string | null,
    producerName: formData.get('producerName') as string,
    wineType: formData.get('wineType') as string,
    country: formData.get('country') as string,
    region: formData.get('region') as string,
    subRegion: (formData.get('subRegion') as string) || '',
    primaryGrape: (formData.get('primaryGrape') as string) || '',
  };

  // Parse bottle data
  const bottleData = {
    quantity: Number(formData.get('quantity')) || 1,
    purchasePrice: formData.get('purchasePrice') ? String(formData.get('purchasePrice')) : null,
    currency: (formData.get('currency') as string) || 'SEK',
    purchaseDate: (formData.get('purchaseDate') as string) || undefined,
    purchaseLocation: (formData.get('purchaseLocation') as string) || '',
    storageLocation: (formData.get('storageLocation') as string) || '',
    personalNotes: (formData.get('personalNotes') as string) || '',
    acquisitionMethod: (formData.get('acquisitionMethod') as string) || 'purchased',
    status: (formData.get('status') as string) || 'in_cellar',
  };

  try {
    let wineRecord: Wine | null = null;
    let createdNewWine = false;

    if (existingWineId) {
      wineRecord = await prisma.wine.findUnique({ where: { id: existingWineId as string } });
      if (!wineRecord) {
        throw new Error('Selected wine could not be found');
      }

      if (imageUrl && !wineRecord.primaryLabelImageUrl) {
        wineRecord = await prisma.wine.update({
          where: { id: wineRecord.id },
          data: { primaryLabelImageUrl: imageUrl },
        });
        console.log('Set primary label image for existing wine');
      }
    } else {
      wineRecord = await prisma.wine.create({
        data: {
          name: wineData.wineName,
          fullName: `${wineData.producerName} ${wineData.wineName} ${wineData.vintage || 'NV'}`,
          vintage: wineData.vintage ? Number(wineData.vintage) : null,
          producerName: wineData.producerName,
          wineType: wineData.wineType as any,
          country: wineData.country,
          region: wineData.region,
          subRegion: wineData.subRegion || null,
          primaryGrape: wineData.primaryGrape || null,
          primaryLabelImageUrl: imageUrl,
        },
      });
      createdNewWine = true;
      console.log('Created new wine:', wineRecord.id);
    }

    if (!wineRecord) {
      throw new Error('Could not create or locate wine record');
    }

    const bottle = await prisma.bottle.create({
      data: {
        userId: session.user.id,
        wineId: wineRecord.id,
        quantity: bottleData.quantity,
        purchasePrice: bottleData.purchasePrice,
        currency: bottleData.currency,
        purchaseDate: bottleData.purchaseDate ? new Date(bottleData.purchaseDate) : null,
        purchaseLocation: bottleData.purchaseLocation || null,
        storageLocation: bottleData.storageLocation || null,
        personalNotes: bottleData.personalNotes || null,
        labelImageUrl: imageUrl,
        tags: [],
        acquisitionMethod: bottleData.acquisitionMethod as any,
        status: bottleData.status as any,
      },
      include: {
        wine: true,
      },
    });

    if (createdNewWine) {
      const generated = await generateWineDescription({
        name: wineRecord.name,
        producerName: wineRecord.producerName,
        wineType: wineRecord.wineType ? wineRecord.wineType.toString() : undefined,
        vintage: wineRecord.vintage,
        country: wineRecord.country,
        region: wineRecord.region,
        subRegion: wineRecord.subRegion,
        primaryGrape: wineRecord.primaryGrape,
      });

      if (generated) {
        await prisma.wine.update({
          where: { id: wineRecord.id },
          data: {
            description: generated.description,
            aiGeneratedSummary: generated.summary,
          },
        });
      }
    }

    if (imageUrl) {
      await prisma.labelScan.create({
        data: {
          userId: session.user.id,
          bottleId: bottle.id,
          imageUrl,
          extractedData: wineData,
          userConfirmed: true,
        },
      });
    }

    revalidatePath('/cellar');
    revalidatePath('/dashboard');

    return { success: true, bottleId: bottle.id };
  } catch (error) {
    console.error('Error creating bottle from scan:', error);
    throw new Error('Failed to create bottle');
  }
}
