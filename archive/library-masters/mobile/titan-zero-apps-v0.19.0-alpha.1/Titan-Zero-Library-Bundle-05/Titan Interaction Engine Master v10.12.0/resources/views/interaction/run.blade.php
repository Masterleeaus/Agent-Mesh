@extends('layouts.app')

@section('title', $definition->name ?? 'Interaction')

@section('content')
<div class="container mx-auto px-4 py-8">
    <div class="bg-white rounded-lg shadow-lg p-6">
        <h1 class="text-2xl font-bold mb-4">{{ $definition->name ?? 'Interaction' }}</h1>
        <p class="text-gray-600 mb-6">{{ $definition->description ?? '' }}</p>

        @if(isset($currentSection))
            <div class="mb-4">
                <h2 class="text-xl font-semibold">{{ $currentSection->title }}</h2>
            </div>

            <form method="POST" action="{{ route('interaction.process', $state['id'] ?? '') }}">
                @csrf
                <input type="hidden" name="run_id" value="{{ $state['id'] ?? '' }}">

                @foreach($currentSection->questions as $question)
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">
                            {{ $question->question }}
                            @if(isset($question->validation['required']) && $question->validation['required'])
                                <span class="text-red-500">*</span>
                            @endif
                        </label>

                        @if($question->responseType === 'text')
                            <input type="text" name="answers[{{ $question->key }}]"
                                   class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                   value="{{ old('answers.'.$question->key, $answers[$question->key] ?? '') }}">
                        @elseif($question->responseType === 'select')
                            <select name="answers[{{ $question->key }}]"
                                    class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200">
                                <option value="">Select...</option>
                                @foreach($question->options as $option)
                                    <option value="{{ $option['value'] ?? $option }}"
                                        {{ (old('answers.'.$question->key, $answers[$question->key] ?? '') == ($option['value'] ?? $option)) ? 'selected' : '' }}>
                                        {{ $option['label'] ?? $option }}
                                    </option>
                                @endforeach
                            </select>
                        @elseif($question->responseType === 'boolean')
                            <input type="checkbox" name="answers[{{ $question->key }}]" value="1"
                                   class="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                   {{ old('answers.'.$question->key, $answers[$question->key] ?? false) ? 'checked' : '' }}>
                        @elseif($question->responseType === 'long_text')
                            <textarea name="answers[{{ $question->key }}]" rows="3"
                                      class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200">{{ old('answers.'.$question->key, $answers[$question->key] ?? '') }}</textarea>
                        @elseif($question->responseType === 'date')
                            <input type="date" name="answers[{{ $question->key }}]"
                                   class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                   value="{{ old('answers.'.$question->key, $answers[$question->key] ?? '') }}">
                        @elseif($question->responseType === 'money')
                            <div class="relative">
                                <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                                <input type="number" step="0.01" name="answers[{{ $question->key }}]"
                                       class="w-full pl-8 rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                       value="{{ old('answers.'.$question->key, $answers[$question->key] ?? '') }}">
                            </div>
                        @elseif($question->responseType === 'integer')
                            <input type="number" step="1" name="answers[{{ $question->key }}]"
                                   class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                   value="{{ old('answers.'.$question->key, $answers[$question->key] ?? '') }}">
                        @else
                            <input type="text" name="answers[{{ $question->key }}]"
                                   class="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200"
                                   value="{{ old('answers.'.$question->key, $answers[$question->key] ?? '') }}">
                        @endif

                        @error('answers.'.$question->key)
                            <p class="text-red-600 text-sm mt-1">{{ $message }}</p>
                        @enderror
                    </div>
                @endforeach

                <div class="flex justify-between mt-6">
                    <button type="submit" name="action" value="back"
                            class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
                        ← Back
                    </button>
                    <button type="submit" name="action" value="next"
                            class="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                        Next →
                    </button>
                </div>
            </form>
        @else
            <p>No active section.</p>
        @endif
    </div>
</div>
@endsection
