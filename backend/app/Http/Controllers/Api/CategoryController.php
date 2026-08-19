<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreCategoryRequest;
use App\Http\Requests\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\JsonResponse;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = Category::withCount('transactions')
            ->where('user_id', auth()->id())
            ->orderBy('type')
            ->orderBy('name')
            ->get();

        return response()->json($categories);
    }

    public function store(StoreCategoryRequest $request): JsonResponse
    {
        $category = Category::create(array_merge($request->validated(), ['user_id' => auth()->id()]));

        return response()->json($category, 201);
    }

    public function show(Category $category): JsonResponse
    {
        abort_if($category->user_id !== auth()->id(), 403);
        return response()->json($category->loadCount('transactions'));
    }

    public function update(UpdateCategoryRequest $request, Category $category): JsonResponse
    {
        abort_if($category->user_id !== auth()->id(), 403);
        $category->update($request->validated());

        return response()->json($category);
    }

    public function destroy(Category $category): JsonResponse
    {
        abort_if($category->user_id !== auth()->id(), 403);

        if ($category->transactions()->exists()) {
            return response()->json([
                'message' => 'Cannot delete category with existing transactions.',
            ], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted successfully.']);
    }
}
