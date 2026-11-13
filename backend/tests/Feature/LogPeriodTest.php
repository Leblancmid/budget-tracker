<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

/** The Logs page shows one period at a time: the last 90 days unless another is chosen. */
class LogPeriodTest extends TestCase
{
    use RefreshDatabase;

    public function test_logs_cover_the_chosen_period(): void
    {
        Sanctum::actingAs(User::factory()->create(['role' => 'admin']));
        $this->travel(-200)->days();
        $this->postJson('/api/v1/categories', ['name' => 'Old food', 'type' => 'expense'])->assertCreated();
        $this->travelBack();
        $this->travel(-40)->days();
        $this->postJson('/api/v1/categories', ['name' => 'Recent food', 'type' => 'expense'])->assertCreated();
        $this->travelBack();

        $names = fn (string $query = '') => collect($this->getJson('/api/v1/logs' . $query)->assertOk()->json('data'))->pluck('description')->filter()->implode(' | ');

        $this->assertStringContainsString('Recent food', $names());
        $this->assertStringNotContainsString('Old food', $names());
        $this->getJson('/api/v1/logs')->assertJsonPath('days', 90);

        $this->assertStringNotContainsString('Recent food', $names('?days=30'));
        $this->assertStringContainsString('Old food', $names('?days=365'));
        $this->assertStringContainsString('Old food', $names('?days=0'));
        $this->getJson('/api/v1/logs?days=7')->assertUnprocessable();
    }
}
