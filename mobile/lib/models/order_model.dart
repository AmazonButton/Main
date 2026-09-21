class OrderItemModel {
  final String id;
  final String productName;
  final int quantity;
  final int unitPrice;
  final int totalPrice;

  OrderItemModel({
    required this.id,
    required this.productName,
    required this.quantity,
    required this.unitPrice,
    required this.totalPrice,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) {
    return OrderItemModel(
      id: json['id'] ?? '',
      productName: json['productName'] ?? json['product']?['name'] ?? 'Sản phẩm',
      quantity: json['quantity'] ?? 1,
      unitPrice: json['unitPrice'] is int ? json['unitPrice'] : (json['unitPrice'] as num?)?.toInt() ?? 0,
      totalPrice: json['totalPrice'] is int ? json['totalPrice'] : (json['totalPrice'] as num?)?.toInt() ?? 0,
    );
  }
}

class OrderModel {
  final String id;
  final String orderNumber;
  final String status;
  final int totalAmount;
  final String createdAt;
  final String? cancelReason;
  final List<OrderItemModel> items;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.totalAmount,
    required this.createdAt,
    this.cancelReason,
    required this.items,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    List<OrderItemModel> orderItems = [];
    if (json['items'] != null && json['items'] is List) {
      orderItems = (json['items'] as List)
          .map((item) => OrderItemModel.fromJson(item))
          .toList();
    }

    return OrderModel(
      id: json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? '',
      status: json['status'] ?? 'PENDING',
      totalAmount: json['totalAmount'] is int
          ? json['totalAmount']
          : (json['totalAmount'] as num?)?.toInt() ?? 0,
      createdAt: json['createdAt'] ?? '',
      cancelReason: json['cancelReason'],
      items: orderItems,
    );
  }
}
