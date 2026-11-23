<?php

namespace App\Services;

use App\Models\SiteSetting;
use Carbon\CarbonImmutable;

/**
 * Your monthly profit goal (₱), the same every month until you change it, and how a month is doing
 * against it: progress, and for the current month whether you're on pace.
 */
class ProfitGoal
{
    public const KEY = 'profit_goal';

    public static function get(): ?float
    {
        $php = ((array) SiteSetting::read(self::KEY, []))['php'] ?? null;

        return is_numeric($php) && $php > 0 ? (float) $php : null;
    }

    public static function set(?float $php): void
    {
        SiteSetting::write(self::KEY, ['php' => $php !== null && $php > 0 ? round($php, 2) : null]);
    }

    /**
     * How a month's sold profit stands against the goal. For the current month: what you'd have by
     * now on an even pace, and the profit a day still needed. Null without a goal.
     *
     * @return array{goal_php: float, profit_php: float, percent: float, status: string, expected_php: ?float, needed_per_day: ?float, days_left: ?int}|null
     */
    public static function progress(float $profit, int $year, int $month): ?array
    {
        $goal = self::get();
        if ($goal === null) {
            return null;
        }
        $now   = CarbonImmutable::now(BalanceInterest::ZONE);
        $start = CarbonImmutable::create($year, $month, 1, 0, 0, 0, BalanceInterest::ZONE);
        $base  = ['goal_php' => $goal, 'profit_php' => round($profit, 2), 'percent' => round($profit / $goal * 100, 1), 'expected_php' => null, 'needed_per_day' => null, 'days_left' => null];

        if ($profit >= $goal) {
            return [...$base, 'status' => 'reached'];
        }
        if ($start->isAfter($now)) {
            return [...$base, 'status' => 'upcoming'];
        }
        if ($start->endOfMonth()->isBefore($now)) {
            return [...$base, 'status' => 'missed'];
        }

        // The current month: on pace if you're at least where an even pace would be by today
        $days     = $start->daysInMonth;
        $dayNo    = $now->day;
        $expected = $goal * $dayNo / $days;
        $daysLeft = $days - $dayNo + 1; // today still counts

        return [...$base,
            'status'         => $profit >= $expected ? 'on_pace' : 'behind',
            'expected_php'   => round($expected, 2),
            'needed_per_day' => round(($goal - $profit) / $daysLeft, 2),
            'days_left'      => $daysLeft,
        ];
    }
}
