class TitanCustomerRecord {
  final String id,name,phone,email;
  final List<TitanCustomerAddress> addresses;
  final List<TitanContactEvent> history;
  const TitanCustomerRecord({required this.id,required this.name,required this.phone,required this.email,this.addresses=const [],this.history=const []});
}
class TitanCustomerAddress {
  final String label,address; final double? latitude,longitude;
  const TitanCustomerAddress({required this.label,required this.address,this.latitude,this.longitude});
}
class TitanContactEvent {
  final String type,summary,when;
  const TitanContactEvent({required this.type,required this.summary,required this.when});
}
