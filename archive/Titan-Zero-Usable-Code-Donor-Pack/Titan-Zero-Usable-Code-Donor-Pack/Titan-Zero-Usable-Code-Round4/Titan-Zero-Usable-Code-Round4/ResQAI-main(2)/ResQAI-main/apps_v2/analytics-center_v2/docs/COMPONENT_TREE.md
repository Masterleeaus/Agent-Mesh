# Component Tree

```
<AppProvider>
  <AppLayout>
    <Topbar>
    <Sidebar> (20 nav items)
    <main>
      <Routes> (22 routes)
        <ExecutiveDashboardPage>
          <LiveKPICards>
            <DataFreshnessIndicator>
            <KpiDashboardGrid>
              <MetricCard> x8
          <Tabs>
          <TimeSeriesChart>
          <DataExportButton>
          <DateRangeNavigator>

        <SupportAnalyticsPage>
          <KpiDashboardGrid> (4 KPIs)
          <BarChart> (by status)
          <PieChart> (by priority)
          <AnalyticsFilterBar>

        <OperationsAnalyticsPage>
          <KpiDashboardGrid> (4 KPIs)
          <BarChart> (by type)
          <TimeSeriesChart> (trend)

        <AppointmentAnalyticsPage>
          <KpiDashboardGrid> (4 KPIs)
          <PieChart> (by status)
          <BarChart> (by type)
          <TimeSeriesChart> (trend)

        <AccountAnalyticsPage>
          <KpiDashboardGrid> (4 KPIs)
          <PieChart> (health distribution)
          <BarChart> (churn factors)
          <TimeSeriesChart> (trend)

        <DisputeAnalyticsPage>
          <KpiDashboardGrid> (4 KPIs)
          <PieChart> (by status)
          <BarChart> (by reason)

        <TechnicianPerformancePage>
          <KpiDashboardGrid> (4 KPIs)
          <Tabs>
          <TechnicianRankingsTable>
          <BarChart> (productivity)
          <Leaderboard> (top techs)
          <TimeSeriesChart> (trend)

        <CustomerAnalyticsPage>
          <KpiDashboardGrid> (6 KPIs)
          <PieChart> (by segment)
          <TimeSeriesChart> (satisfaction)
          <CustomerMetricsTable>

        <CRMAnalyticsPage>
          <KpiDashboardGrid> (6 KPIs)
          <BarChart> (by tier)
          <PieChart> (pipeline)
          <TimeSeriesChart> (trend)

        <ResolutionAnalyticsPage>
          <KpiDashboardGrid> (5 KPIs)
          <BarChart> (by type)
          <TimeSeriesChart> (trend)
          <Table> (assignee performance)

        <SLADashboardPage>
          <KpiDashboardGrid> (6 KPIs)
          <BarChart> (compliance)
          <TimeSeriesChart> (breaches)
          <SLAReportsTable>

        <ProductivityDashboardPage>
          <KpiDashboardGrid> (6 KPIs)
          <BarChart> (by team)
          <TimeSeriesChart> (throughput)
          <Leaderboard> (top performers)

        <TrendAnalysisPage>
          <KpiDashboardGrid> (4 KPIs)
          <ComparePeriodsForm>
          <AreaChart> x4
          <BarChart> (correlations)

        <ForecastingPage>
          <Dropdown> (metric selector)
          <AreaChart> (forecast)
          <Card> x3 (forecast cards)

        <ReportsPage>
          <GenerateReportForm>
          <DeleteReportDialog>
          <Table> (reports list)

        <CustomReportsPage>
          <Skeleton> / <EmptyState>
          <Table>

        <ReportBuilderPage>
          <Input>
          <ReportBuilderCanvas>
          <ChartConfigPanel>

        <ScheduledReportsPage>
          <ScheduledReportCard> xN
          <EmptyState>

        <ExportCenterPage>
          <ExportReportForm>
          <ExportConfirmationDialog>
          <ExportHistoryTable>

        <AuditAnalyticsPage>
          <KpiDashboardGrid> (3 KPIs)
          <BarChart> (by type)
          <TimeSeriesChart> (trend)
          <Table> (recent actions)

        <SystemHealthPage>
          <KpiDashboardGrid> (6 KPIs)
          <Card> (service status list)

        <SearchPage>
          <Input> (search)
          <Card> xN (results)

  <NotificationCenter>
```

## Shared Components Used

Button, Input, Dropdown, Card, Table, Dialog, Form, SearchBar, Filter, StatusBadge, ProgressIndicator, Skeleton, EmptyState, ErrorState, NotificationCenter, Sidebar, Topbar, Tabs, Pagination, Loader, PermissionGuard

## App-Specific Components (31 total)

| Component | Description |
|-----------|-------------|
| MetricCard | KPI data card with trend indicator |
| KpiDashboardGrid | Responsive grid of MetricCards |
| TimeSeriesChart | SVG line chart for trends |
| BarChart | SVG bar chart for comparisons |
| PieChart | SVG donut chart for distributions |
| AreaChart | SVG filled area chart |
| HeatMap | Grid-based heat map visualization |
| TrendGraph | Multi-line comparison graph |
| Leaderboard | Ranked entry list |
| LiveKPICards | Auto-refreshing KPI dashboard |
| AnalyticsFilterBar | Domain/date range filters |
| DateRangeNavigator | Date range dropdown |
| DataFreshnessIndicator | Last-updated status dot |
| DataExportButton | Format selector + export trigger |
| DrillDownLink | Navigational link |
| ReportBuilderCanvas | Drag-drop report canvas |
| ChartConfigPanel | Chart configuration form |
| ScheduledReportCard | Schedule display card |
| KpiReportTable | Tabular KPI breakdown |
| HistoricalMetricsTable | Time-series history table |
| TechnicianRankingsTable | Ranked technician table |
| CustomerMetricsTable | Customer-level metrics table |
| SLAReportsTable | SLA per domain table |
| ExportHistoryTable | Past export records table |
| ExportConfirmationDialog | Export confirmation modal |
| ScheduleConfirmationDialog | Schedule confirmation modal |
| DeleteReportDialog | Delete confirmation modal |
| GenerateReportForm | Report creation form |
| ExportReportForm | Export configuration form |
| ScheduleReportForm | Schedule configuration form |
| FilterAnalyticsForm | Advanced filter form |
| ComparePeriodsForm | Period comparison form |

## State Management

- **App-wide**: React Context (AppProvider)
- **Data fetching**: Custom hooks with loading/error/data pattern
- **Local UI state**: useState per component
