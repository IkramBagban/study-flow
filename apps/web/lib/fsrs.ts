/**
 * FSRS (Free Spaced Repetition Scheduler) Implementation
 * Based on the ts-fsrs library patterns but with a lightweight custom implementation
 * Ref: https://github.com/open-spaced-repetition/ts-fsrs
 */

// FSRS Parameters - default values from the algorithm
export const FSRS_PARAMS = {
    requestRetention: 0.9,    // Target retention rate (90%)
    maximumInterval: 36500,   // Max interval (100 years in days)
    w: [                      // FSRS-5 default weights
        0.4072, 0.8847, 2.7568, 9.1873,
        5.2412, 1.1471, 1.0046, 0.0612,
        1.4974, 0.0233, 1.0082, 2.0449,
        0.0632, 0.3346, 1.4116, 0.2112,
        2.6791, 0.1004, 0.3503
    ]
};

// Card States
export enum State {
    New = 0,
    Learning = 1,
    Review = 2,
    Relearning = 3
}

// Rating options
export enum Rating {
    Again = 1,
    Hard = 2,
    Good = 3,
    Easy = 4
}

// Card data structure matching our Prisma model
export interface FSRSCard {
    due: Date;
    stability: number;
    difficulty: number;
    elapsedDays: number;
    scheduledDays: number;
    reps: number;
    lapses: number;
    state: State;
    lastReview: Date | null;
}

// Review log for tracking history
export interface ReviewLog {
    rating: Rating;
    state: State;
    due: Date;
    stability: number;
    difficulty: number;
    elapsedDays: number;
    scheduledDays: number;
    review: Date;
}

/**
 * Create an empty new card
 */
export function createEmptyCard(now: Date = new Date()): FSRSCard {
    return {
        due: now,
        stability: 0,
        difficulty: 0,
        elapsedDays: 0,
        scheduledDays: 0,
        reps: 0,
        lapses: 0,
        state: State.New,
        lastReview: null
    };
}

/**
 * FSRS Core Scheduler
 */
export class FSRS {
    private w: number[];
    private requestRetention: number;
    private maximumInterval: number;

    constructor(params: Partial<typeof FSRS_PARAMS> = {}) {
        this.w = params.w ?? FSRS_PARAMS.w;
        this.requestRetention = params.requestRetention ?? FSRS_PARAMS.requestRetention;
        this.maximumInterval = params.maximumInterval ?? FSRS_PARAMS.maximumInterval;
    }

    /**
     * Calculate the next state for a card given a rating
     */
    next(card: FSRSCard, now: Date, rating: Rating): { card: FSRSCard; log: ReviewLog } {
        const elapsedDays = card.lastReview
            ? Math.max(0, Math.floor((now.getTime() - card.lastReview.getTime()) / (1000 * 60 * 60 * 24)))
            : 0;

        // Create a copy of the card
        const newCard: FSRSCard = { ...card, elapsedDays };

        // Create log of THIS review (before changes)
        const log: ReviewLog = {
            rating,
            state: card.state,
            due: card.due,
            stability: card.stability,
            difficulty: card.difficulty,
            elapsedDays: card.elapsedDays,
            scheduledDays: card.scheduledDays,
            review: now
        };

        // Process based on current state
        switch (card.state) {
            case State.New:
                this.processNewCard(newCard, rating);
                break;
            case State.Learning:
            case State.Relearning:
                this.processLearningCard(newCard, rating, elapsedDays);
                break;
            case State.Review:
                this.processReviewCard(newCard, rating, elapsedDays);
                break;
        }

        // Set last review and increment reps
        newCard.lastReview = now;
        newCard.reps += 1;

        return { card: newCard, log };
    }

    /**
     * Process a new card (first time seeing it)
     */
    private processNewCard(card: FSRSCard, rating: Rating): void {
        // Initial stability based on rating
        card.stability = this.initStability(rating);
        card.difficulty = this.initDifficulty(rating);

        switch (rating) {
            case Rating.Again:
                card.state = State.Learning;
                card.scheduledDays = 0;
                card.due = this.addMinutes(new Date(), 1); // 1 min
                card.lapses += 1;
                break;
            case Rating.Hard:
                card.state = State.Learning;
                card.scheduledDays = 0;
                card.due = this.addMinutes(new Date(), 5); // 5 min
                break;
            case Rating.Good:
                card.state = State.Learning;
                card.scheduledDays = 0;
                card.due = this.addMinutes(new Date(), 10); // 10 min
                break;
            case Rating.Easy:
                card.state = State.Review;
                const interval = this.nextInterval(card.stability);
                card.scheduledDays = interval;
                card.due = this.addDays(new Date(), interval);
                break;
        }
    }

    /**
     * Process a card in learning/relearning state
     */
    private processLearningCard(card: FSRSCard, rating: Rating, elapsedDays: number): void {
        switch (rating) {
            case Rating.Again:
                card.state = card.state === State.Learning ? State.Learning : State.Relearning;
                card.scheduledDays = 0;
                card.due = this.addMinutes(new Date(), 5);
                if (card.state === State.Relearning) {
                    card.lapses += 1;
                }
                break;
            case Rating.Hard:
                card.scheduledDays = 0;
                card.due = this.addMinutes(new Date(), 10);
                break;
            case Rating.Good:
            case Rating.Easy:
                card.state = State.Review;
                card.stability = this.nextRecallStability(card, elapsedDays, rating);
                card.difficulty = this.nextDifficulty(card.difficulty, rating);
                const interval = this.nextInterval(card.stability);
                card.scheduledDays = interval;
                card.due = this.addDays(new Date(), interval);
                break;
        }
    }

    /**
     * Process a card in review state
     */
    private processReviewCard(card: FSRSCard, rating: Rating, elapsedDays: number): void {
        const retrievability = this.forgettingCurve(elapsedDays, card.stability);

        switch (rating) {
            case Rating.Again:
                card.state = State.Relearning;
                card.stability = this.nextForgetStability(card.difficulty, card.stability, retrievability);
                card.difficulty = this.nextDifficulty(card.difficulty, rating);
                card.lapses += 1;
                card.scheduledDays = 0;
                card.due = this.addMinutes(new Date(), 5);
                break;
            case Rating.Hard:
            case Rating.Good:
            case Rating.Easy:
                card.state = State.Review;
                card.stability = this.nextRecallStability(card, elapsedDays, rating);
                card.difficulty = this.nextDifficulty(card.difficulty, rating);
                const interval = this.nextInterval(card.stability);
                card.scheduledDays = interval;
                card.due = this.addDays(new Date(), interval);
                break;
        }
    }

    // FSRS Core Functions

    private initStability(rating: Rating): number {
        return Math.max(0.1, this.w[rating - 1] ?? 0.1);
    }

    private initDifficulty(rating: Rating): number {
        const w4 = this.w[4] ?? 1;
        const w5 = this.w[5] ?? 1;
        return Math.min(Math.max(w4 - Math.exp(w5 * (rating - 1)) + 1, 1), 10);
    }

    private forgettingCurve(elapsedDays: number, stability: number): number {
        if (stability === 0) return 0;
        return Math.pow(1 + elapsedDays / (9 * stability), -1);
    }

    private nextInterval(stability: number): number {
        const newInterval = (stability / 0.9) * (Math.pow(this.requestRetention, 1 / -0.5) - 1);
        return Math.min(Math.max(Math.round(newInterval), 1), this.maximumInterval);
    }

    private nextDifficulty(d: number, rating: Rating): number {
        const w6 = this.w[6] ?? 0;
        const w4 = this.w[4] ?? 1;
        const nextD = d - w6 * (rating - 3);
        return Math.min(Math.max(this.meanReversion(w4, nextD), 1), 10);
    }

    private meanReversion(init: number, current: number): number {
        const w7 = this.w[7] ?? 0;
        return w7 * init + (1 - w7) * current;
    }

    private nextRecallStability(card: FSRSCard, elapsedDays: number, rating: Rating): number {
        const retrievability = this.forgettingCurve(elapsedDays, card.stability);
        const hardPenalty = rating === Rating.Hard ? (this.w[15] ?? 1) : 1;
        const easyBonus = rating === Rating.Easy ? (this.w[16] ?? 1) : 1;
        const w8 = this.w[8] ?? 1;
        const w9 = this.w[9] ?? 1;
        const w10 = this.w[10] ?? 1;

        return (
            card.stability *
            (1 +
                Math.exp(w8) *
                (11 - card.difficulty) *
                Math.pow(card.stability, -w9) *
                (Math.exp((1 - retrievability) * w10) - 1) *
                hardPenalty *
                easyBonus)
        );
    }

    private nextForgetStability(d: number, s: number, r: number): number {
        const w11 = this.w[11] ?? 1;
        const w12 = this.w[12] ?? 1;
        const w13 = this.w[13] ?? 1;
        const w14 = this.w[14] ?? 1;
        return (
            w11 *
            Math.pow(d, -w12) *
            (Math.pow(s + 1, w13) - 1) *
            Math.exp((1 - r) * w14)
        );
    }

    // Utility functions

    private addMinutes(date: Date, minutes: number): Date {
        return new Date(date.getTime() + minutes * 60 * 1000);
    }

    private addDays(date: Date, days: number): Date {
        const result = new Date(date);
        result.setDate(result.getDate() + days);
        return result;
    }
}

/**
 * Get scheduling preview for all ratings
 */
export function getSchedulingCards(card: FSRSCard, now: Date = new Date()): Record<Rating, { card: FSRSCard; log: ReviewLog }> {
    const fsrs = new FSRS();
    return {
        [Rating.Again]: fsrs.next(card, now, Rating.Again),
        [Rating.Hard]: fsrs.next(card, now, Rating.Hard),
        [Rating.Good]: fsrs.next(card, now, Rating.Good),
        [Rating.Easy]: fsrs.next(card, now, Rating.Easy)
    };
}
