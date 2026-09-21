class TitanMobileBackgroundRefreshPolicy {
  final Duration minimumInterval;
  const TitanMobileBackgroundRefreshPolicy({this.minimumInterval=const Duration(minutes:15)});
  bool mayRefresh({required DateTime now,DateTime? lastRefresh,required bool networkAvailable,required bool lowPowerMode}){
    if(!networkAvailable||lowPowerMode)return false;
    return lastRefresh==null||now.difference(lastRefresh)>=minimumInterval;
  }
  bool get mayExecuteBusinessMutation=>false;
}
