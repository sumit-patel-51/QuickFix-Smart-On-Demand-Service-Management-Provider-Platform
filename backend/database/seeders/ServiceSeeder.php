<?php

namespace Database\Seeders;

use App\Models\Service;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            [
                'name' => 'AC Repair',
                'category' => 'AC & Appliance',
                'description' => 'Professional AC repair service.',
                'base_price' => 499,
                'is_active' => true,
            ],
            [
                'name' => 'AC Service',
                'category' => 'AC & Appliance',
                'description' => 'Complete AC servicing and maintenance.',
                'base_price' => 399,
                'is_active' => true,
            ],
            [
                'name' => 'Plumbing',
                'category' => 'Plumbing',
                'description' => 'Professional plumbing repair service.',
                'base_price' => 299,
                'is_active' => true,
            ],
            [
                'name' => 'Electrician',
                'category' => 'Electrical',
                'description' => 'Electrical repair and installation service.',
                'base_price' => 299,
                'is_active' => true,
            ],
            [
                'name' => 'Laptop Repair',
                'category' => 'Computer',
                'description' => 'Laptop hardware and software repair.',
                'base_price' => 399,
                'is_active' => true,
            ],
            [
                'name' => 'TV Repair',
                'category' => 'Electronics',
                'description' => 'Professional television repair service.',
                'base_price' => 399,
                'is_active' => true,
            ],
            [
                'name' => 'Home Cleaning',
                'category' => 'Cleaning',
                'description' => 'Professional home cleaning service.',
                'base_price' => 599,
                'is_active' => true,
            ],
            [
                'name' => 'Carpenter',
                'category' => 'Home Maintenance',
                'description' => 'Furniture and carpentry repair service.',
                'base_price' => 349,
                'is_active' => true,
            ],
        ];

        foreach ($services as $service) {
            Service::create($service);
        }
    }
}
