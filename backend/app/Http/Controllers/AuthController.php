<?php
// PATH: app/Http/Controllers/AuthController.php
// This version does NOT use UserResource — user data is returned as a plain array.
// No need to create app/Http/Resources/UserResource.php with this version.

namespace App\Http\Controllers;

use App\Models\Provider;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Throwable;

class AuthController extends Controller
{
    /**
     * Small helper so we don't repeat the same array shape in register/login/me.
     * Keeps the password and internal fields out of every response.
     */
    private function formatUser(User $user): array
{
    return [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'phone' => $user->phone,
        'address' => $user->address,
        'role' => $user->role,
        'status' => $user->status,
        'is_verified' => $user->is_verified,

        // Profile image
        'profile_photo' => $user->profile_photo
            ? asset('storage/' . $user->profile_photo)
            : null,

        'created_at' => $user->created_at
            ? $user->created_at->toDateTimeString()
            : null,
    ];
}

    /**
     * POST /api/register
     * Registers a new CUSTOMER account and returns an auth token.
     */
    public function register(Request $request)
    {
        // ---------- VALIDATION ----------
        $validator = Validator::make($request->all(), [
            'name' => ['required', 'string', 'min:3', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:150', 'unique:users,email'],
            'phone' => ['required', 'string', 'regex:/^[6-9][0-9]{9}$/', 'unique:users,phone'],
            'password' => [
                'required',
                'string',
                'min:8',
                'confirmed', // needs password_confirmation field to match
                'regex:/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/', // 1 lowercase, 1 uppercase, 1 number
            ],
            'address' => ['nullable', 'string', 'max:255'],
        ], [
            'name.required' => 'Name is required.',
            'name.min' => 'Name must be at least 3 characters.',
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address.',
            'email.unique' => 'This email is already registered. Try logging in.',
            'phone.required' => 'Phone number is required.',
            'phone.regex' => 'Enter a valid 10-digit mobile number.',
            'phone.unique' => 'This phone number is already registered.',
            'password.required' => 'Password is required.',
            'password.min' => 'Password must be at least 8 characters.',
            'password.confirmed' => 'Password and confirmation do not match.',
            'password.regex' => 'Password must include at least 1 uppercase letter, 1 lowercase letter, and 1 number.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        // ---------- CREATE USER ----------
        try {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'phone' => $validated['phone'],
                'password' => Hash::make($validated['password']),
                'address' => $validated['address'] ?? null,
                'role' => 'customer', // registration via this endpoint is always customer
                'status' => 'active',
            ]);

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'success' => true,
                'message' => 'Registration successful',
                'data' => [
                    'user' => $this->formatUser($user),
                    'token' => $token,
                    'token_type' => 'Bearer',
                ],
            ], 201);
        } catch (Throwable $e) {
            Log::error('Registration failed: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Something went wrong while creating your account. Please try again.',
            ], 500);
        }
    }

    /**
     * POST /api/login
     * Authenticates a user by email + password and returns a fresh token.
     */
    public function login(Request $request)
    {
        // ---------- VALIDATION ----------
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required' => 'Email is required.',
            'email.email' => 'Please enter a valid email address.',
            'password.required' => 'Password is required.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        // ---------- CHECK CREDENTIALS ----------
        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password',
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your account is ' . $user->status . '. Please contact support.',
            ], 403);
        }

        // Revoke old tokens so only the latest login session stays valid
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;
        
        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                'user' => $this->formatUser($user),
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ], 200);
    }

    /**
     * POST /api/admin/login
     * Admin-specific login - only allows users with 'admin' role
     */
    public function adminLogin(Request $request)
    {
        // ---------- VALIDATION ----------
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required' => 'Email is required.',
            'email.email' => 'Please enter a valid email address.',
            'password.required' => 'Password is required.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        // ---------- CHECK CREDENTIALS ----------
        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password',
            ], 401);
        }

        // Check if user has admin role
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Access denied. Admin privileges required.',
            ], 403);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your account is ' . $user->status . '. Please contact support.',
            ], 403);
        }

        // Revoke old tokens
        $user->tokens()->delete();

        $token = $user->createToken('admin_auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Admin login successful',
            'data' => [
                'user' => $this->formatUser($user),
                'token' => $token,
                'token_type' => 'Bearer',
            ],
        ], 200);
    }

    //provider registration
    public function registerProvider(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'required|string|max:20',
        ]);


        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'password' => Hash::make($validated['password']),
            'role' => 'provider',
            'status' => 'active',
        ]);

        $provider = Provider::create([
            'user_id' => $user->id,
            'is_online' => false,
            'availability_status' => 'offline',
            'verification_status' => 'pending',
        ]);

        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Provider registration successful.',
            'data' => [
                'user' => $user,
                'provider' => $provider,
                'token' => $token,
            ],
        ], 201);
    }

    //provider login
     public function loginProvider(Request $request)
    {
        // ---------- VALIDATION ----------
        $validator = Validator::make($request->all(), [
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ], [
            'email.required' => 'Email is required.',
            'email.email' => 'Please enter a valid email address.',
            'password.required' => 'Password is required.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors(),
            ], 422);
        }

        $validated = $validator->validated();

        // ---------- CHECK CREDENTIALS ----------
        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Invalid email or password',
            ], 401);
        }

        if ($user->status !== 'active') {
            return response()->json([
                'success' => false,
                'message' => 'Your account is ' . $user->status . '. Please contact support.',
            ], 403);
        }

        // Revoke old tokens so only the latest login session stays valid
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;
        
        return response()->json([
            'success' => true,
            'message' => 'Login successful',
            'data' => [
                 // IMPORTANT: Provider data with profile image
            'user' => $this->formatProviderUser($user),
                'token' => $token,
                'token_type' => 'Bearer',
                'verification_status' => $user->provider->verification_status,
            ],
        ], 200);
    }

    /**
     * POST /api/logout
     * Requires Authorization: Bearer <token> header.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * GET /api/user
     * Returns the currently authenticated user (used by React to check login state on refresh).
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => $this->formatUser($request->user()),
        ]);
    }

    //After logout image show this code

    private function formatProviderUser(User $user): array
{
    $provider = $user->provider;

    return [
        'id' => $user->id,
        'name' => $user->name,
        'email' => $user->email,
        'phone' => $user->phone,
        'address' => $user->address,
        'role' => $user->role,
        'status' => $user->status,
        'is_verified' => $user->is_verified,

        // Provider data
        'provider_id' => $provider?->id,

        'profile_image' => $provider?->profile_image
            ? asset('storage/' . $provider->profile_image)
            : null,

        'verification_status' => $provider?->verification_status,
        'is_online' => $provider?->is_online,
        'availability_status' => $provider?->availability_status,

        'created_at' => $user->created_at?->toDateTimeString(),
    ];
}
}