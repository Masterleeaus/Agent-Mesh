<?php

declare(strict_types=1);
namespace App\Extensions\TitanHub\System\Contracts;

interface CustomerOperationsGateway
{
    public function home(array $context): array;
    public function homeSummary(array $context): array;
    public function services(array $context, array $filters=[]): array;
    public function serviceRequests(array $context, array $filters=[]): array;
    public function serviceRequest(array $context, string $id): ?array;
    public function createServiceRequest(array $context, array $payload): array;
    public function jobs(array $context, array $filters=[]): array;
    public function job(array $context, string $id): ?array;
    public function workOrders(array $context, array $filters=[]): array;
    public function workOrder(array $context, string $id): ?array;
    public function bookings(array $context, array $filters=[]): array;
    public function requestBookingChange(array $context, string $id, array $payload): array;
    public function support(array $context, array $filters=[]): array;
    public function locations(array $context, array $filters=[]): array;
    public function quotes(array $context, array $filters=[]): array;
    public function quote(array $context, string $id): ?array;
    public function approveQuote(array $context, string $id, array $payload=[]): array;
    public function invoices(array $context, array $filters=[]): array;
    public function invoice(array $context, string $id): ?array;
    public function documents(array $context, array $filters=[]): array;
    public function profile(array $context): array;
}
