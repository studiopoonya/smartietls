<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiKeyResolutionTest extends TestCase
{
    use RefreshDatabase;

    public function test_env_key_works_when_nothing_is_saved_in_the_dashboard(): void
    {
        config(['services.anthropic.key' => 'sk-ant-from-env']);

        $this->assertSame('sk-ant-from-env', User::factory()->create()->effectiveApiKey());
    }

    public function test_env_key_takes_priority_over_a_saved_key(): void
    {
        config(['services.anthropic.key' => 'sk-ant-from-env']);

        $user = User::factory()->create(['anthropic_api_key' => 'sk-ant-saved']);

        $this->assertSame('sk-ant-from-env', $user->effectiveApiKey());
    }

    public function test_dashboard_keys_still_work_when_env_is_empty(): void
    {
        config(['services.anthropic.key' => '']);

        User::factory()->create(['is_admin' => true, 'anthropic_api_key' => 'sk-ant-admin']);
        $student = User::factory()->create();
        $withOwnKey = User::factory()->create(['anthropic_api_key' => 'sk-ant-own']);

        $this->assertSame('sk-ant-admin', $student->effectiveApiKey());
        $this->assertSame('sk-ant-own', $withOwnKey->effectiveApiKey());
    }
}
