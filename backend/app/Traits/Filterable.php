<?php

namespace App\Traits;

use Illuminate\Database\Eloquent\Builder;

trait Filterable
{
    public function scopeAutoFilter(Builder $query, array $filters)
    {
        $allowedFilters = property_exists($this, 'filterable') ? $this->filterable : [];

        // =========================================================================
        // 1. HANDLE GLOBAL SEARCH (Untuk Global Search Box di Datatable)
        // =========================================================================
        if (!empty($filters['search'])) {
            $searchValue = $filters['search'];

            // Bungkus di dalam closure WHERE agar klausa OR tidak merusak query lain
            $query->where(function ($subQuery) use ($allowedFilters, $searchValue) {
                foreach ($allowedFilters as $field => $operatorType) {
                    // Global search hanya memeriksa kolom yang di-whitelist sebagai 'like'
                    if ($operatorType === 'like') {
                        // Jika kolom relasi (mengandungi titik, contoh: 'rumah.nomor_rumah')
                        if (str_contains($field, '.')) {
                            [$relation, $relationField] = explode('.', $field);
                            $subQuery->orWhereHas($relation, function ($q) use ($relationField, $searchValue) {
                                $q->where($relationField, 'LIKE', '%' . $searchValue . '%');
                            });
                        } else {
                            // Jika kolom lokal biasa
                            $subQuery->orWhere($field, 'LIKE', '%' . $searchValue . '%');
                        }
                    }
                }
            });
        }

        // =========================================================================
        // 2. HANDLE SPECIFIC COLUMN FILTERS (Untuk Dropdown / Filter Spesifik Kolom)
        // =========================================================================
        foreach ($filters as $field => $value) {
            // Abaikan keyword 'search', value kosong, atau field yang tidak di-whitelist
            if ($field === 'search' || is_null($value) || $value === '' || !array_key_exists($field, $allowedFilters)) {
                continue;
            }

            $operatorType = strtolower($allowedFilters[$field]);

            // JIKA FILTER KOLOM RELASI (Contoh: rumah.status_rumah)
            if (str_contains($field, '.')) {
                [$relation, $relationField] = explode('.', $field);

                $query->whereHas($relation, function ($q) use ($relationField, $value, $operatorType) {
                    if (is_array($value)) {
                        $q->whereIn($relationField, $value);
                    } elseif ($operatorType === 'like') {
                        $q->where($relationField, 'LIKE', '%' . $value . '%');
                    } else {
                        $q->where($relationField, $value);
                    }
                });
            } 
            // JIKA FILTER KOLOM LOKAL BIASA
            else {
                if (is_array($value)) {
                    $query->whereIn($field, $value);
                } elseif ($operatorType === 'like') {
                    $query->where($field, 'LIKE', '%' . $value . '%');
                } else {
                    $query->where($field, $value);
                }
            }
        }

        return $query;
    }
}