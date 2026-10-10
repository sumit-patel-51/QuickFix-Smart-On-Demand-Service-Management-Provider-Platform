<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use App\Models\ServiceRequest;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'phone',
        'password',
        'address',
       'profile_photo',
        'role',
        'status',
        'is_verified',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_verified' => 'boolean',
        ];
    }



    /**
     * Helper methods to check role — useful later in controllers/middleware.
     */
    public function isCustomer(): bool
    {
        return $this->role === 'customer';
    }

    public function isProvider(): bool
    {
        return $this->role === 'provider';
    }

    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }


    public function serviceRequests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class, 'customer_id');
    }

    //provider profile
    public function provider()
    {
        return $this->hasOne(Provider::class);
    }

    //review
    public function givenReviews(): HasMany
    {
        return $this->hasMany(
            Review::class,
            'reviewer_id'
        );
    }

    public function receivedReviews(): HasMany
    {
        return $this->hasMany(
            Review::class,
            'reviewee_id'
        );
    }
}