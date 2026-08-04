import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const exercises = [
  { name: 'Bench press', muscleGroup: 'Chest', equipment: 'Barbell' },
  { name: 'Incline dumbbell press', muscleGroup: 'Chest', equipment: 'Dumbbell' },
  { name: 'Overhead press', muscleGroup: 'Shoulders', equipment: 'Barbell' },
  { name: 'Barbell row', muscleGroup: 'Back', equipment: 'Barbell' },
  { name: 'Lat pulldown', muscleGroup: 'Back', equipment: 'Cable' },
  { name: 'Squat', muscleGroup: 'Legs', equipment: 'Barbell' },
  { name: 'Deadlift', muscleGroup: 'Back', equipment: 'Barbell' },
  { name: 'Bicep curl', muscleGroup: 'Arms', equipment: 'Dumbbell' },
  { name: 'Tricep pushdown', muscleGroup: 'Arms', equipment: 'Cable' },
  { name: 'Incline chest press', muscleGroup: 'Chest', equipment: 'Machine' },
  { name: 'T bar for upper back', muscleGroup: 'Back', equipment: 'Machine' },
  { name: 'Lateral raises', muscleGroup: 'Shoulders', equipment: 'Dumbbell' },
  { name: 'Rear delt fly', muscleGroup: 'Shoulders', equipment: 'Machine' },
  { name: 'Chest fly', muscleGroup: 'Chest', equipment: 'Cable' },
  { name: 'Preacher curl', muscleGroup: 'Arms', equipment: 'Barbell' },
  { name: 'Lower back pull machine', muscleGroup: 'Back', equipment: 'Machine' },
  { name: 'Romanian deadlift', muscleGroup: 'Legs', equipment: 'Barbell' },
  { name: 'Leg extension', muscleGroup: 'Legs', equipment: 'Machine' },
  { name: 'Abductors', muscleGroup: 'Legs', equipment: 'Machine' },
  { name: 'Calf raises', muscleGroup: 'Legs', equipment: 'Machine' },
  { name: 'Leg raises', muscleGroup: 'Abs', equipment: 'Bodyweight' },
  { name: 'Cable crunches', muscleGroup: 'Abs', equipment: 'Cable' },
  { name: 'Smith machine shoulder press', muscleGroup: 'Shoulders', equipment: 'Machine' },
  { name: 'Hammer curl', muscleGroup: 'Arms', equipment: 'Dumbbell' },
  { name: 'Overhead tricep extension', muscleGroup: 'Arms', equipment: 'Dumbbell' },
  { name: 'Pec Dec fly', muscleGroup: 'Chest', equipment: 'Machine' },
  { name: 'T bar row upper back', muscleGroup: 'Back', equipment: 'Machine' },
  { name: 'T bar lat row', muscleGroup: 'Back', equipment: 'Machine' },
];

async function main() {
  for (const exercise of exercises) {
    await prisma.exercise.upsert({
      where: { name: exercise.name },
      update: exercise,
      create: exercise,
    });
  }
  console.log(`Seeded ${exercises.length} exercises`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());