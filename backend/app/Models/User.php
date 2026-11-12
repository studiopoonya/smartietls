<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Crypt;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    protected $fillable = [
        'name',
        'email',
        'password',
        'anthropic_api_key',
        'target_band',
        'skill_minimums',
        'feedback_language',
        'streak_days',
        'last_active_date',
        'exam_date',
        'is_admin',
        'study_weeks',
        'plan_start_date',
        'reminder_time',
        'reminder_enabled',
    ];

    protected $hidden = [
        'password',
        'remember_token',
        'anthropic_api_key',
    ];

    protected $appends = ['has_api_key'];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'target_band'       => 'float',
            'skill_minimums'    => 'array',
            'last_active_date'  => 'date',
            'exam_date'         => 'date',
            'plan_start_date'   => 'date',
            'is_admin'          => 'boolean',
            'reminder_enabled'  => 'boolean',
        ];
    }

    public function setAnthropicApiKeyAttribute(?string $value): void
    {
        $this->attributes['anthropic_api_key'] = $value ? Crypt::encryptString($value) : null;
    }

    public function getDecryptedApiKey(): ?string
    {
        if (!$this->attributes['anthropic_api_key']) return null;
        return Crypt::decryptString($this->attributes['anthropic_api_key']);
    }

    public function hasApiKey(): bool
    {
        return !empty($this->attributes['anthropic_api_key']);
    }

    public static function systemApiKey(): ?string
    {
        $admin = static::where('is_admin', true)
            ->whereNotNull('anthropic_api_key')
            ->first();
        return $admin?->getDecryptedApiKey();
    }

    /** ANTHROPIC_API_KEY in .env wins; keys saved from the dashboard are only a fallback. */
    public function effectiveApiKey(): ?string
    {
        return config('services.anthropic.key')
            ?: ($this->hasApiKey() ? $this->getDecryptedApiKey() : static::systemApiKey());
    }

    /** True when ANTHROPIC_API_KEY in .env is set, which overrides every key saved from the dashboard. */
    public static function usesServerKey(): bool
    {
        return !empty(config('services.anthropic.key'));
    }

    /** Whether AI features work for this user, from any source: .env, their own key, or an admin's key. */
    public function aiReady(): bool
    {
        return static::usesServerKey() || $this->hasApiKey() || static::systemApiKey() !== null;
    }

    public function getHasApiKeyAttribute(): bool
    {
        return !empty($this->attributes['anthropic_api_key']);
    }

    public function learningSessions(): HasMany
    {
        return $this->hasMany(LearningSession::class);
    }

    public function vocabularies(): HasMany
    {
        return $this->hasMany(Vocabulary::class);
    }

    public function progressSnapshots(): HasMany
    {
        return $this->hasMany(ProgressSnapshot::class);
    }
}
