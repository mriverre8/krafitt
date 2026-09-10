// Source dictionary. Every other locale is typed against it, so a missing key
// is a compile error rather than a blank string in the UI.
export const en = {
    'app.name': 'Krafitt',
    'app.tagline':
        'Build your gym routines and log every single set, week after week.',

    'nav.today': 'Today',
    'nav.routines': 'Routines',
    'nav.signOut': 'Sign out',
    'nav.theme': 'Switch theme',
    'nav.language': 'Language',
    'nav.settings': 'Settings',
    'nav.menu': 'Menu',
    'nav.profile': 'Profile',
    'nav.back': 'Back',

    'landing.feature1':
        'Build routines with their days, exercises, sets, rep ranges and technique.',
    'landing.feature2':
        'The home screen shows the workout you owe today, and it stays there until you finish it.',
    'landing.feature3':
        "Log weight and reps set by set, with last session's numbers right next to you.",

    'auth.login': 'Sign in',
    'auth.signup': 'Sign up',
    'auth.name': 'Name',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.passwordPlaceholder': 'Password (min. 8)',
    'auth.submitLogin': "Let's go",
    'auth.submitSignup': 'Create account',
    'auth.failed': 'Could not complete',

    'home.noRoutineTitle': 'No active routine',
    'home.noRoutineBody':
        "Create a routine, or mark one of yours as active, to see today's workout here.",
    'home.finishedTitle': 'You finished {name}',
    'home.finishedBody':
        'Every week of the routine is done. Create another one to keep going.',
    'home.goToRoutines': 'Go to my routines',

    'today.week': 'Week {week} of {total}',
    'today.progress': '{done}/{total} sets',
    'today.done': 'Workout complete',
    'today.noExercises': 'This workout has no exercises yet.',
    'today.skip': 'Skip to next day',
    'today.skipConfirm':
        'This day is not finished. The sets you left blank stay blank. Skip it?',
    'today.set': 'Set {n}',
    'today.weightLabel': 'Weight set {n}',
    'today.repsLabel': 'Reps set {n}',
    'today.saveLabel': 'Save set {n}',
    'today.kg': 'kg',
    'today.reps': 'reps',
    'today.setPlan': '{min}-{max} reps',
    'today.setPlanFixed': '{reps} reps',
    'today.previous': 'W{week}: {weight}×{reps}',
    'today.noPrevious': '—',
    'today.genericError': 'Something went wrong',

    'profile.memberSince': 'Member since {date}',
    'profile.stats': '{routines} routines · {workouts} workouts done',
    'profile.activeTitle': 'Active routine',
    'profile.finishedTitle': 'Finished',
    'profile.noFinished': 'No finished routines yet.',

    'routines.title': 'My routines',
    'routines.empty': 'You have no routines yet.',
    'routines.active': 'Active',
    'routines.markActive': 'Set active',
    'routines.incomplete': 'Incomplete',
    'routines.finished': 'Finished',
    'routines.meta': '{weeks} weeks · {days} days',
    'routines.progress': '{done}/{total} workouts',
    'routines.newTitle': 'New routine',
    'routines.namePlaceholder': 'Routine name',
    'routines.nameLabel': 'Name',
    'routines.duration': 'Duration in weeks',
    'routines.create': 'Create routine',

    'routine.meta': '{weeks} weeks · {days} days per week',
    'routine.workouts': 'Workouts',
    // The day strip shows numbers only; the name travels in the tab's label.
    'routine.dayTab': 'Day {n}, {name}',
    'routine.prevDay': 'Previous day',
    'routine.nextDay': 'Next day',
    'routine.unsaved': 'unsaved changes',
    'routine.deleteDay': 'Delete day',
    'routine.deleteDayConfirm': 'Delete {name} and its exercises?',
    'routine.noWorkouts': 'This routine has no workouts yet.',
    'routine.dayPlaceholder': 'New day (e.g. Push A)',
    'routine.dayLabel': 'Day name',
    'routine.addDay': 'Add',
    'routine.edit': 'Edit',
    'routine.doneEditing': 'Done',
    'routine.discardConfirm':
        'You have changes that were never saved. Leave editing and lose them?',
    'routine.delete': 'Delete routine',
    'routine.deleteConfirm': 'Delete the routine {name}? All progress is lost.',

    // A day holds several exercises at once, so every field label carries its
    // exercise number {e}: "Min reps set 1" alone would name four inputs.
    'exercise.namePlaceholder': 'Exercise',
    'exercise.nameLabel': 'Exercise {e} name',
    'exercise.repMode': 'Exercise {e}, reps type set {n}',
    'exercise.repMin': 'Exercise {e}, min reps set {n}',
    'exercise.repMax': 'Exercise {e}, max reps set {n}',
    'exercise.technique': 'Exercise {e}, technique set {n}',
    'exercise.techniquePlaceholder': 'Technique (Straight sets)',
    'exercise.addSet': 'Add set',
    'exercise.addSetLabel': 'Add set to exercise {e}',
    'exercise.removeSet': 'Exercise {e}, remove set {n}',
    'exercise.add': 'Add exercise',
    'exercise.saveChanges': 'Save changes',
    'exercise.undo': 'Undo changes',
    // Short form: below md, Undo shares the save bar and the full label wraps.
    'exercise.undoShort': 'Undo',
    'exercise.delete': 'Delete exercise {e}',
    'exercise.removeShort': 'Delete exercise',
    'exercise.removeSetShort': 'Remove set',

    'reps.range': 'Range',
    'reps.fixed': 'Fixed',
    'reps.amrap': 'AMRAP',
    'reps.unset': 'Reps to define',

    'validate.ok': 'The routine is complete. You can set it as active.',
    'validate.noWorkouts': 'The routine has no days.',
    // Shown inside the day's own card, so they never name the day.
    'validate.emptyDay': 'No exercises yet.',
    'validate.exerciseN': 'Exercise {n}',
    'validate.noName': '{where}: give it a name.',
    'validate.badSets': '{where}: the sets are not properly defined.',
    'validate.showFields': 'Show errors',
    'validate.hideFields': 'Hide errors',

    'technique.linear': 'Straight sets',
    'technique.topset': 'Top set',
    'technique.backoff': 'Back off',

    'error.notSignedIn': 'You are not signed in',
    'error.routineNotFound': 'Routine not found',
    'error.noAccess': 'You do not have access to this routine',
    'error.workoutNotFound': 'Workout not found',
    'error.routineName': 'Give the routine a name',
    'error.nameTooLong': 'That name is too long (max 60 characters)',
    'error.duration': 'Duration must be between 1 and 52 weeks',
    'error.workoutName': 'Give the day a name',
    'error.routineIncomplete': 'Finish the routine before setting it active',
    'error.routineFinished': 'This routine is already finished',
    'error.sets': 'Sets: between 1 and 20',
    'error.exercises': 'Exercises: between 1 and 30',
    'error.repRange': 'The rep range is not valid',
    'error.weight': 'Invalid weight',
    'error.reps': 'Invalid reps',
    'error.alreadyFinished': 'This workout is already finished',
    'error.wrongExercise': 'That exercise is not part of this workout',
    'error.setOutOfRange': 'Set out of range',
    'error.fillPrevious': 'Fill in the previous sets first',
};

export type Dict = typeof en;
export type TKey = keyof Dict;
