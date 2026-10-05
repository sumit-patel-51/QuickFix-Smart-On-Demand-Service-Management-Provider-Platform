<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Models\ServiceRequest;


class Service extends Model
{
    protected $fillable = [
        'name',
        'category',
        'description',
        'base_price',
        'is_active',
    ];
    
       protected $casts = [
        'is_active' => 'boolean',
    ];
    public function serviceRequests(): HasMany
    {
        return $this->hasMany(ServiceRequest::class);
    }

    //provider servises
      public function providers()
    {
        return $this->belongsToMany(
            Provider::class,
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
}
