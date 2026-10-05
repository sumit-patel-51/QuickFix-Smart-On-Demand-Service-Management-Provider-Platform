<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Provider extends Model
{
    protected $fillable = [
        'user_id',
        'profile_image',
        'latitude',
        'longitude',
        'is_online',
        'availability_status',
        'verification_status',
        'rejection_reason',
        'verified_at',
        'verified_by',
        'rating',
        'total_jobs',
    ];

    protected $casts = [
        'is_online' => 'boolean',
        'latitude' => 'decimal:7',
        'longitude' => 'decimal:7',
        'rating' => 'decimal:2',
        'verified_at' => 'datetime',
    ];

    // Provider belongs to a user
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    // Services offered by provider
public function services(): BelongsToMany
{
    return $this->belongsToMany(
        Service::class,
        'provider_services'
    )
    ->withPivot([
        'price',
        'experience',
        'service_area',
        'service_image',
        'is_active',
    ])
    ->withTimestamps();
}

    // Verification documents
    public function documents(): HasMany
    {
        return $this->hasMany(ProviderDocument::class);
    }

    // Admin who verified provider
    public function verifier(): BelongsTo
    {
        return $this->belongsTo(
            User::class,
            'verified_by'
        );
    }

    public function serviceRequests(): HasMany
{
    return $this->hasMany(
        ServiceRequest::class,
        'provider_id'
    );
}
}