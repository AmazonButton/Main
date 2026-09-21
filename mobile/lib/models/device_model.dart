class ProductModel {
  final String id;
  final String name;
  final int price;
  final String? imageUrl;
  final String? unit;

  ProductModel({
    required this.id,
    required this.name,
    required this.price,
    this.imageUrl,
    this.unit,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      price: json['price'] is int ? json['price'] : (json['price'] as num?)?.toInt() ?? 0,
      imageUrl: json['imageUrl'],
      unit: json['unit'] ?? 'cái',
    );
  }
}

class DeviceModel {
  final String id;
  final String deviceId;
  final String? serialNumber;
  final String status;
  final String? claimStatus;
  final String? provisioningStatus;
  final int batteryLevel;
  final int wifiRSSI;
  final int healthScore;
  final String healthStatus;
  final String? lastSeenAt;
  final ProductModel? product;
  final String? nickname;
  final String? customName;
  final int defaultQuantity;
  final String singlePressAction;
  final String doublePressAction;
  final String hold3sAction;
  final String hold5sAction;
  final String? householdId;

  DeviceModel({
    required this.id,
    required this.deviceId,
    this.serialNumber,
    required this.status,
    this.claimStatus,
    this.provisioningStatus,
    required this.batteryLevel,
    required this.wifiRSSI,
    this.healthScore = 90,
    this.healthStatus = 'OPTIMAL',
    this.lastSeenAt,
    this.product,
    this.nickname,
    this.customName,
    this.defaultQuantity = 1,
    this.singlePressAction = 'ORDER_PRODUCT',
    this.doublePressAction = 'ADD_TO_SHOPPING_LIST',
    this.hold3sAction = 'REQUEST_SERVICE',
    this.hold5sAction = 'TRIGGER_EMERGENCY',
    this.householdId,
  });

  bool get isOnline =>
      status == 'ACTIVE' || provisioningStatus == 'CLOUD_CONNECTED';

  String get displayName =>
      customName ?? nickname ?? 'Nút Bấm Tiện Lợi';

  factory DeviceModel.fromJson(Map<String, dynamic> json) {
    ProductModel? prod;
    final config = json['configuration'] as Map<String, dynamic>?;

    if (json['product'] != null) {
      prod = ProductModel.fromJson(json['product']);
    } else if (config != null && config['product'] != null) {
      prod = ProductModel.fromJson(config['product']);
    }

    final cName = json['customName'] ?? config?['customName'] ?? json['nickname'];
    final defQty = config?['defaultQuantity'] is int
        ? config!['defaultQuantity']
        : (config?['defaultQuantity'] as num?)?.toInt() ?? 1;

    return DeviceModel(
      id: json['id'] ?? '',
      deviceId: json['deviceId'] ?? '',
      serialNumber: json['serialNumber'],
      status: json['status'] ?? 'ACTIVE',
      claimStatus: json['claimStatus'],
      provisioningStatus: json['provisioningStatus'],
      batteryLevel: json['batteryLevel'] ?? 100,
      wifiRSSI: json['wifiRSSI'] ?? -50,
      healthScore: json['healthScore'] ?? 90,
      healthStatus: json['healthStatus'] ?? 'OPTIMAL',
      lastSeenAt: json['lastSeenAt'],
      product: prod,
      nickname: json['nickname'],
      customName: cName,
      defaultQuantity: defQty,
      singlePressAction: config?['singlePressAction'] ?? 'ORDER_PRODUCT',
      doublePressAction: config?['doublePressAction'] ?? 'ADD_TO_SHOPPING_LIST',
      hold3sAction: config?['hold3sAction'] ?? 'REQUEST_SERVICE',
      hold5sAction: config?['hold5sAction'] ?? 'TRIGGER_EMERGENCY',
      householdId: json['householdId'],
    );
  }
}
