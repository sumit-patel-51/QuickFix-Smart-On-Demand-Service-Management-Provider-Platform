<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
         User::create([
            'name' => 'Admin User',
            'email' => 'admin@gmail.com',
            'phone' => '8488070778',
            'password' => Hash::make('Admin@123'),
            'role' => 'admin',
            'status' => 'active',
            'is_verified' => true,
        ]);
    }
}