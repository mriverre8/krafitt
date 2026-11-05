'use client';

import { useT } from '@/i18n/use-t';
import { EXERCISES } from '@/lib/constants';
import type { DayAction, FormAction } from '@/lib/forms';
import {
    blankExerciseFault,
    type ExerciseFault,
    type Problem,
} from '@/lib/validate';
import { dashedActionClass } from '@/lib/ui';
import { Plus } from 'lucide-react';
import {
    startTransition,
    useActionState,
    useEffect,
    useEffectEvent,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { flushSync } from 'react-dom';
import { sameExercise } from '@/lib/history';
import { toast } from '@/store/toast';
import { useDiscardSignal, useEditMode } from '@/components/routine/edit-mode';
import {
    emptyExercise,
    moveExercise,
    toDrafts,
    type ExerciseDraft,
} from '@/lib/drafts';
import { swap } from '@/lib/swap';
import { DayHeader } from '@/components/workout/day-header';
import { ExerciseFields } from '@/components/workout/exercise-fields';
import {
    blankExercise,
    ExercisePreview,
} from '@/components/workout/exercise-preview';
import { ProblemsCard } from '@/components/workout/problems-card';
import { SaveBar } from '@/components/workout/save-bar';
import type { ExerciseView } from '@/components/workout/workout-exercise';

/**
 * A card of the editor: its draft, and the key it is drawn under. The key
 * stays with the exercise as cards move or go, so what a card holds of its
 * own — a technique being written — never lands on another one. It lives here
 * rather than in the draft, which is compared and submitted as JSON.
 */
type Card = { key: string; draft: ExerciseDraft };

/**
 * One training day, and the whole of it is a single form: adding, editing and
 * removing exercises all happen in the draft below, and nothing reaches the
 * database until Save changes, the only thing here that talks to the server.
 *
 * The day owns the screen, so its name is the heading and each exercise gets a
 * card of its own. Save follows you down the page rather than waiting at the
 * bottom of a column of cards you would have to scroll back past.
 */
export function WorkoutEditor({
    workout,
    problems,
    faults,
    saveExercises,
    onRenameWorkout,
    onDeleteWorkout,
    retired = [],
    empty,
}: {
    workout: { id: string; name: string; exercises: ExerciseView[] };
    /** What this day is still missing, as last saved. */
    problems: Problem[];
    /** The same holes as fields to paint, by exercise id. */
    faults: Record<string, ExerciseFault>;
    saveExercises: DayAction;
    /** Already bound to this day. Left out for a workout, whose one day goes
        by the workout's name — the page's own heading — and so is drawn with
        no heading or day menu of its own. */
    onRenameWorkout?: FormAction;
    /** Absent once the routine has started: its days are fixed from then on. */
    onDeleteWorkout?: (workoutId: string) => Promise<void>;
    /** Exercises the day archived, by name. Naming a card after one brings it
        back with its history — the server matches exercises by name. */
    retired?: string[];
    /** What a day with nothing on it says out of edit mode. Given, it also
        opens empty in edit mode — just the button to add the first exercise —
        instead of on the blank card a routine's day starts from. */
    empty?: ReactNode;
}) {
    const t = useT();
    const editing = useEditMode();
    const fresh = (exercises: ExerciseView[]) => toDrafts(exercises, !empty);
    // A saved exercise is keyed by its id. The only draft `fresh` makes
    // without one is the blank card an empty day opens on.
    const freshCards = (exercises: ExerciseView[]): Card[] =>
        fresh(exercises).map((draft) => ({ key: draft.id ?? 'blank', draft }));
    const [state, formAction, pending] = useActionState(saveExercises, {});
    const [cards, setCards] = useState(() => freshCards(workout.exercises));
    const drafts = cards.map((card) => card.draft);
    // For the cards Add makes: counted in the click, never while rendering.
    const added = useRef(0);
    // Only what is not on a card already: one exercise is never in a day twice
    // by being brought back.
    const suggestions = retired.filter(
        (name) => !drafts.some((draft) => sameExercise(draft.name, name))
    );
    const [highlight, setHighlight] = useState(false);
    const list = useRef<HTMLDivElement>(null);

    const showProblems = editing && problems.length > 0;

    // What the server holds. Its own answer to the last save outranks the props,
    // which lag behind it and sometimes never move at all: a technique left blank
    // is stored as the default, which can leave the day exactly as it was.
    const server = state.saved ?? workout.exercises;
    const saved = JSON.stringify(fresh(server));
    const plan = JSON.stringify(drafts);
    const dirty = plan !== saved;

    // Adjusting state while rendering rather than in an effect: the drafts start
    // again from the day the server sends back, defaults filled in and ids handed
    // out to whatever was new.
    const [lastState, setLastState] = useState(state);
    if (state !== lastState) {
        setLastState(state);
        if (state.saved) setCards(freshCards(state.saved));
    }

    // The save bar goes away on success and nothing else on screen says so;
    // a refused save is the server's word on the whole day, not one field's.
    // An effect, unlike the above: the toast lives in another component's
    // store, and that may not be written to mid-render. It answers the save
    // and nothing else — `t` is read, not watched: every revalidation hands
    // the layout a fresh dictionary, and every day already saved would toast
    // again with it.
    const announce = useEffectEvent((answer: typeof state) => {
        if (answer.saved) toast(t('toast.daySaved'));
        if (answer.error) toast(answer.error, 'error');
    });
    useEffect(() => announce(state), [state]);

    // Leaving edit mode throws unsaved work away, having asked first — the
    // routine does the asking, since it is the whole set of days that is in
    // question and not this one. Same trick as above: back to the last save.
    const discarded = useDiscardSignal(workout.id, dirty);
    const [lastDiscarded, setLastDiscarded] = useState(discarded);
    if (discarded !== lastDiscarded) {
        setLastDiscarded(discarded);
        setCards(freshCards(server));
    }

    /**
     * The saved faults this card is owed. A card the user has only just added
     * is in no save yet, so nothing is known to be wrong with it and it stays
     * unpainted — with one exception: the blank card a day with nothing saved
     * opens with is the very card the problems above are about, and it has no
     * id to be filed under.
     */
    function faultOf(draft: ExerciseDraft, index: number) {
        if (!showProblems || !highlight) return undefined;
        if (draft.id) return faults[draft.id];
        return !empty && workout.exercises.length === 0 && index === 0
            ? blankExerciseFault
            : undefined;
    }

    /**
     * The new order is committed at once and the focus kept on the card that
     * moved — onto its other arrow when it has reached the end of the day and
     * this one has gone dead. The page itself stays where it is: the focus
     * moves without scrolling, and the card slides away from under the
     * pointer rather than the page jumping after it.
     *
     * The two cards slide past each other (`swap`). The pair is named by hand
     * for the length of the slide: the moving one's name passes from its old
     * slot to its new one, and the names go once the slide is over.
     */
    function move(index: number, step: -1 | 1) {
        const to = index + step;
        const nodes = list.current?.children;
        const name = (at: number, value: string) => {
            const card = nodes?.[at] as HTMLElement | undefined;
            card?.style.setProperty('view-transition-name', value);
            card?.style.setProperty('view-transition-class', value && 'swap');
        };
        name(index, 'exercise-moving');
        name(to, 'exercise-other');

        swap(() => {
            flushSync(() =>
                setCards((current) => moveExercise(current, index, to))
            );
            name(to, 'exercise-moving');
            name(index, 'exercise-other');

            const arrows = step < 0 ? ['up', 'down'] : ['down', 'up'];
            const button = arrows
                .map((arrow) =>
                    nodes?.[to]?.querySelector<HTMLButtonElement>(
                        `[data-move="${arrow}"]`
                    )
                )
                .find((button) => button && !button.disabled);
            button?.focus({ preventScroll: true });
        }).then(() => {
            name(index, '');
            name(to, '');
        });
    }

    function update(index: number, patch: Partial<ExerciseDraft>) {
        setCards((current) =>
            current.map((card, i) =>
                i === index
                    ? { ...card, draft: { ...card.draft, ...patch } }
                    : card
            )
        );
    }

    /**
     * The action is dispatched by hand rather than through `<form action>`.
     * React resets the form once the action settles, and that reset drops a
     * controlled `<select>` back onto its first option — the rep type would
     * spring back to Range on every save until the page was reloaded. Nothing
     * is lost by leaving the form out: the day travels as one JSON field.
     *
     * A `<form action>` opens the transition for you; dispatching by hand has to
     * open it here, or `pending` never flips and the button stays live mid-save.
     */
    function save() {
        const data = new FormData();
        data.set('workoutId', workout.id);
        data.set('plan', plan);
        startTransition(() => formAction(data));
    }

    return (
        <div>
            {onRenameWorkout && (
                <DayHeader
                    name={workout.name}
                    editing={editing}
                    onRename={onRenameWorkout}
                    onDelete={
                        onDeleteWorkout && (() => onDeleteWorkout(workout.id))
                    }
                />
            )}

            {showProblems && (
                <ProblemsCard
                    problems={problems}
                    highlight={highlight}
                    onToggle={() => setHighlight((shown) => !shown)}
                    className={onRenameWorkout ? 'mt-4' : ''}
                />
            )}

            <div
                ref={list}
                className="mt-4 space-y-4"
            >
                {editing
                    ? cards.map(({ key, draft }, index) => (
                          <ExerciseFields
                              key={key}
                              exercise={draft}
                              index={index}
                              suggestions={suggestions}
                              fault={faultOf(draft, index)}
                              onChange={(patch) => update(index, patch)}
                              onRemove={() =>
                                  setCards((current) =>
                                      current.filter((_, i) => i !== index)
                                  )
                              }
                              canRemove={drafts.length > 1}
                              onMove={(step) => move(index, step)}
                              isLast={index === drafts.length - 1}
                          />
                      ))
                    : server.map((exercise) => (
                          <ExercisePreview
                              key={exercise.id}
                              exercise={exercise}
                          />
                      ))}

                {!editing &&
                    server.length === 0 &&
                    (empty ?? <ExercisePreview exercise={blankExercise} />)}

                {editing && (
                    <button
                        type="button"
                        disabled={drafts.length >= EXERCISES.max}
                        onClick={() => {
                            const key = `added-${added.current++}`;
                            setCards((current) => [
                                ...current,
                                { key, draft: emptyExercise },
                            ]);
                        }}
                        className={`${dashedActionClass} w-full p-5`}
                    >
                        <Plus
                            size={14}
                            aria-hidden
                        />
                        {t('exercise.add')}
                    </button>
                )}
            </div>

            {editing && dirty && (
                <SaveBar
                    pending={pending}
                    onUndo={() => setCards(freshCards(workout.exercises))}
                    onSave={save}
                />
            )}
        </div>
    );
}
