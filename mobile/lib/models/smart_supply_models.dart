import 'device_model.dart';

class HouseholdMemberModel {
  final String id;
  final String userId;
  final String role; // OWNER, ADMIN, MEMBER, VIEWER, TECHNICIAN
  final String? nickname;
  final String? fullName;
  final String? email;

  HouseholdMemberModel({
    required this.id,
    required this.userId,
    required this.role,
    this.nickname,
    this.fullName,
    this.email,
  });

  factory HouseholdMemberModel.fromJson(Map<String, dynamic> json) {
    final user = json['user'] as Map<String, dynamic>?;
    return HouseholdMemberModel(
      id: json['id'] ?? '',
      userId: json['userId'] ?? '',
      role: json['role'] ?? 'MEMBER',
      nickname: json['nickname'],
      fullName: user?['fullName'] ?? json['fullName'],
      email: user?['email'] ?? json['email'],
    );
  }
}

class HouseholdModel {
  final String id;
  final String name;
  final String? address;
  final String? apartment;
  final String? building;
  final String myRole;
  final List<HouseholdMemberModel> members;

  HouseholdModel({
    required this.id,
    required this.name,
    this.address,
    this.apartment,
    this.building,
    this.myRole = 'MEMBER',
    this.members = const [],
  });

  factory HouseholdModel.fromJson(Map<String, dynamic> json) {
    final memList = (json['members'] as List<dynamic>?)
            ?.map((m) => HouseholdMemberModel.fromJson(m as Map<String, dynamic>))
            .toList() ??
        [];
    final membership = json['membership'] as Map<String, dynamic>?;
    final role = json['currentMemberRole'] ?? membership?['role'] ?? 'MEMBER';

    return HouseholdModel(
      id: json['id'] ?? '',
      name: json['name'] ?? 'Gia đình',
      address: json['address'],
      apartment: json['apartment'],
      building: json['building'],
      myRole: role,
      members: memList,
    );
  }
}

class PredictionInsightModel {
  final String productId;
  final String productName;
  final String unit;
  final int sampleCount;
  final double meanIntervalDays;
  final double stdDevDays;
  final DateTime expectedReplenishmentDate;
  final double daysRemaining;
  final int confidenceScore;
  final String status; // OPTIMAL, DUE_SOON, OVERDUE
  final String explanation;

  PredictionInsightModel({
    required this.productId,
    required this.productName,
    required this.unit,
    required this.sampleCount,
    required this.meanIntervalDays,
    required this.stdDevDays,
    required this.expectedReplenishmentDate,
    required this.daysRemaining,
    required this.confidenceScore,
    required this.status,
    required this.explanation,
  });

  factory PredictionInsightModel.fromJson(Map<String, dynamic> json) {
    return PredictionInsightModel(
      productId: json['productId'] ?? '',
      productName: json['productName'] ?? '',
      unit: json['unit'] ?? 'cái',
      sampleCount: json['sampleCount'] ?? 0,
      meanIntervalDays: (json['meanIntervalDays'] as num?)?.toDouble() ?? 0.0,
      stdDevDays: (json['stdDevDays'] as num?)?.toDouble() ?? 0.0,
      expectedReplenishmentDate: json['expectedReplenishmentDate'] != null
          ? DateTime.parse(json['expectedReplenishmentDate'])
          : DateTime.now(),
      daysRemaining: (json['daysRemaining'] as num?)?.toDouble() ?? 0.0,
      confidenceScore: json['confidenceScore'] ?? 80,
      status: json['status'] ?? 'OPTIMAL',
      explanation: json['explanation'] ?? '',
    );
  }
}

class SmartReminderModel {
  final String id;
  final String productId;
  final ProductModel? product;
  final DateTime expectedDate;
  final int confidence;
  final String reason;
  final String status; // PENDING, ACCEPTED, ADDED_TO_LIST, SNOOZED, DISMISSED

  SmartReminderModel({
    required this.id,
    required this.productId,
    this.product,
    required this.expectedDate,
    required this.confidence,
    required this.reason,
    required this.status,
  });

  factory SmartReminderModel.fromJson(Map<String, dynamic> json) {
    return SmartReminderModel(
      id: json['id'] ?? '',
      productId: json['productId'] ?? '',
      product: json['product'] != null ? ProductModel.fromJson(json['product']) : null,
      expectedDate: json['expectedDate'] != null
          ? DateTime.parse(json['expectedDate'])
          : DateTime.now(),
      confidence: json['confidence'] ?? 85,
      reason: json['reason'] ?? '',
      status: json['status'] ?? 'PENDING',
    );
  }
}

class ShoppingListItemModel {
  final String id;
  final String productId;
  final ProductModel? product;
  final int quantity;
  final bool isChecked;
  final String? addedFromDeviceId;

  ShoppingListItemModel({
    required this.id,
    required this.productId,
    this.product,
    required this.quantity,
    required this.isChecked,
    this.addedFromDeviceId,
  });

  factory ShoppingListItemModel.fromJson(Map<String, dynamic> json) {
    return ShoppingListItemModel(
      id: json['id'] ?? '',
      productId: json['productId'] ?? '',
      product: json['product'] != null ? ProductModel.fromJson(json['product']) : null,
      quantity: json['quantity'] ?? 1,
      isChecked: json['isChecked'] ?? false,
      addedFromDeviceId: json['addedFromDeviceId'],
    );
  }
}

class ServiceRequestModel {
  final String id;
  final String? deviceId;
  final String type;
  final String category;
  final String? description;
  final String status; // PENDING, ACCEPTED, IN_PROGRESS, RESOLVED, CANCELLED
  final String priority;
  final DateTime createdAt;

  ServiceRequestModel({
    required this.id,
    this.deviceId,
    required this.type,
    required this.category,
    this.description,
    required this.status,
    required this.priority,
    required this.createdAt,
  });

  factory ServiceRequestModel.fromJson(Map<String, dynamic> json) {
    return ServiceRequestModel(
      id: json['id'] ?? '',
      deviceId: json['deviceId'],
      type: json['type'] ?? 'MAINTENANCE',
      category: json['category'] ?? 'Dịch vụ',
      description: json['description'],
      status: json['status'] ?? 'PENDING',
      priority: json['priority'] ?? 'NORMAL',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }
}

class UrgentAlertModel {
  final String id;
  final String? deviceId;
  final String alertType;
  final String message;
  final String status;
  final DateTime createdAt;

  UrgentAlertModel({
    required this.id,
    this.deviceId,
    required this.alertType,
    required this.message,
    required this.status,
    required this.createdAt,
  });

  factory UrgentAlertModel.fromJson(Map<String, dynamic> json) {
    return UrgentAlertModel(
      id: json['id'] ?? '',
      deviceId: json['deviceId'],
      alertType: json['alertType'] ?? 'GAS_ISSUE',
      message: json['message'] ?? '',
      status: json['status'] ?? 'ACTIVE',
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : DateTime.now(),
    );
  }
}
