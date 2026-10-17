// Dữ liệu mẫu ban đầu — chỉ dùng khi chưa có data/db.json.
// Sau khi chạy lần đầu, mọi chỉnh sửa thực hiện trong trang /admin.
const IMG = id => `https://images.unsplash.com/photo-${id}?w=1600&q=75&auto=format&fit=crop`;
const now = Date.now();
let n = 0;
const id = () => 'seed' + (++n).toString(36).padStart(3, '0');

// Lịch khởi hành mẫu: các ngày cách nhau 7 ngày từ 06/11/2026
function deps(price, airline, count = 8, startDay = 6) {
  const out = [];
  const d = new Date(Date.UTC(2026, 10, startDay));
  for (let i = 0; i < count; i++) {
    const x = new Date(d.getTime() + i * 7 * 864e5);
    out.push({ date: `${String(x.getUTCDate()).padStart(2, '0')}/${String(x.getUTCMonth() + 1).padStart(2, '0')}/${x.getUTCFullYear()}`, airline, price: price + (i % 3 === 2 ? 500000 : 0), seats: 6 + ((i * 5) % 14) });
  }
  return out;
}

const INCLUDES_CN = [
  'Vé máy bay khứ hồi (hành lý ký gửi 20kg + 7kg xách tay)',
  'Visa đoàn nhập cảnh Trung Quốc',
  'Khách sạn tiêu chuẩn 4 sao địa phương, 2 người/phòng',
  'Các bữa ăn theo chương trình',
  'Xe du lịch đời mới đưa đón suốt tuyến',
  'Vé tham quan các điểm theo chương trình (lần 1)',
  'Hướng dẫn viên tiếng Việt suốt tuyến + HDV địa phương',
  'Bảo hiểm du lịch quốc tế mức 200.000.000đ/vụ',
  'Nước uống 1 chai/ngày, quà tặng Lumi Travel',
];
const EXCLUDES_CN = [
  'Hộ chiếu (còn hạn trên 6 tháng)',
  'Phụ thu phòng đơn',
  'Tiền tip HDV và lái xe: 150.000đ/khách/ngày',
  'Chi phí cá nhân, đồ uống ngoài chương trình',
  'Các điểm tham quan tự chọn ngoài chương trình',
];
const CHILD = [
  'Trẻ em dưới 2 tuổi: 30% giá tour (ngủ chung giường với bố mẹ)',
  'Trẻ em từ 2 đến dưới 12 tuổi: 75% giá tour (ngủ chung giường với bố mẹ)',
  'Trẻ em từ 12 tuổi trở lên: tính như người lớn',
];
const NOTES = [
  'Đặt cọc 50% giá tour khi đăng ký, thanh toán phần còn lại trước ngày khởi hành 10 ngày',
  'Quý khách gửi ảnh hộ chiếu rõ nét để làm visa ngay khi đặt cọc',
  'Thứ tự tham quan có thể thay đổi tùy tình hình thực tế nhưng đảm bảo đủ điểm',
  'Hủy tour sau khi đã làm visa: không hoàn lại phí visa',
];

const tour = (o) => ({
  id: id(), code: '', tag: '', rating: 5, featured: false, published: true, hotel: 'Khách sạn 4 sao', transport: 'Máy bay, ô tô',
  includes: INCLUDES_CN, excludes: EXCLUDES_CN, childPolicy: CHILD, notes: NOTES, createdAt: now - (n * 3600e3), updatedAt: now, ...o,
});

const tours = [
  tour({
    slug: 'truong-gia-gioi-phuong-hoang-co-tran-5n4d', code: 'TS-CN01', category: 'china', featured: true, tag: 'Bán chạy',
    title: 'Hà Nội - Trương Gia Giới - Thiên Môn Sơn - Phượng Hoàng Cổ Trấn 5 ngày 4 đêm',
    destination: 'Trương Gia Giới', departFrom: 'Hà Nội', days: '5N4Đ', price: 13990000, oldPrice: 16990000, schedule: 'Thứ 5 hàng tuần',
    highlights: 'Thiên Môn Sơn - Cầu kính Thiên Môn - Viên Gia Giới (Avatar) - Thang máy Bách Long - Phượng Hoàng Cổ Trấn - Sông Đà Giang',
    images: [IMG('1567266565245-c08dc046815f'), IMG('1514920735211-8c697444a248'), IMG('1520745947248-e287a72ed646'), IMG('1510001618818-4b4e3d86bf0f')],
    summary: 'Chiêm ngưỡng rừng cột đá huyền ảo đã truyền cảm hứng cho bộ phim Avatar, đi cáp treo dài nhất thế giới lên Thiên Môn Sơn và thả mình vào nét cổ kính của Phượng Hoàng Cổ Trấn về đêm.',
    itinerary: [
      { title: 'Ngày 1: Hà Nội - Trương Gia Giới', content: 'Quý khách tập trung tại sân bay Nội Bài, đáp chuyến bay thẳng đi Trương Gia Giới.\nHDV đón đoàn, ăn tối và nhận phòng khách sạn nghỉ ngơi.' },
      { title: 'Ngày 2: Thiên Môn Sơn - Cầu kính - Thiên Môn Động', content: 'Đi cáp treo dài hơn 7km lên Thiên Môn Sơn, dạo bước trên Quỷ Cốc Sạn Đạo và cầu kính treo vách núi.\nChiêm ngưỡng Thiên Môn Động - “cổng trời” với 999 bậc thang.' },
      { title: 'Ngày 3: Viên Gia Giới - Thang máy Bách Long', content: 'Tham quan khu thắng cảnh Viên Gia Giới - nơi quay bộ phim Avatar, núi Càn Khôn Trụ, Thiên Hạ Đệ Nhất Kiều.\nTrải nghiệm thang máy ngoài trời cao nhất thế giới Bách Long. Chiều di chuyển về Phượng Hoàng Cổ Trấn.' },
      { title: 'Ngày 4: Phượng Hoàng Cổ Trấn', content: 'Dạo quanh cổ trấn ngàn năm tuổi bên dòng Đà Giang, ngắm nhà sàn Điếu Cước Lâu, cầu Hồng Kiều.\nBuổi tối tự do ngắm phố cổ lung linh ánh đèn, thả hoa đăng cầu may.' },
      { title: 'Ngày 5: Phượng Hoàng - Trương Gia Giới - Hà Nội', content: 'Ăn sáng, xe đưa đoàn ra sân bay đáp chuyến bay về Hà Nội. Kết thúc chương trình, chia tay đoàn.' },
    ],
    departures: deps(13990000, 'Vietjet Air'),
  }),
  tour({
    slug: 'bac-kinh-thuong-hai-hang-chau-to-chau-6n5d', code: 'TS-CN02', category: 'china', featured: true, tag: 'Hot',
    title: 'Hà Nội - Bắc Kinh - Thượng Hải - Hàng Châu - Tô Châu 6 ngày 5 đêm',
    destination: 'Bắc Kinh - Thượng Hải', departFrom: 'Hà Nội', days: '6N5Đ', price: 18990000, oldPrice: 22990000, schedule: 'Thứ 3 hàng tuần',
    transport: 'Máy bay, tàu cao tốc, ô tô',
    highlights: 'Vạn Lý Trường Thành - Tử Cấm Thành - Thiên An Môn - Thiên Đàn - Tây Hồ - Bến Thượng Hải - Lâm viên Tô Châu',
    images: [IMG('1508804185872-d7badad00f7d'), IMG('1577706881850-bf7c7d8906a5'), IMG('1538428494232-9c0d8a3ab403'), IMG('1587153662967-c9d9977bf8d3')],
    summary: 'Hành trình kinh điển xuyên qua hai thành phố lớn nhất Trung Hoa: chinh phục Vạn Lý Trường Thành, khám phá Tử Cấm Thành, ngồi tàu cao tốc 350km/h và ngắm Bến Thượng Hải lộng lẫy về đêm.',
    itinerary: [
      { title: 'Ngày 1: Hà Nội - Bắc Kinh', content: 'Đáp chuyến bay đi Bắc Kinh. HDV đón đoàn, ăn tối món vịt quay Bắc Kinh trứ danh, nhận phòng khách sạn.' },
      { title: 'Ngày 2: Vạn Lý Trường Thành - Thập Tam Lăng', content: 'Chinh phục Vạn Lý Trường Thành - Cư Dung Quan, tham quan Định Lăng thuộc quần thể Thập Tam Lăng.\nTối ngắm Tổ Chim, Khối Nước - công trình Olympic Bắc Kinh 2008.' },
      { title: 'Ngày 3: Thiên An Môn - Tử Cấm Thành - Thiên Đàn', content: 'Tham quan quảng trường Thiên An Môn, Tử Cấm Thành - hoàng cung của 24 đời vua Minh Thanh, Thiên Đàn.\nChiều đáp tàu cao tốc đi Thượng Hải.' },
      { title: 'Ngày 4: Hàng Châu - Tây Hồ', content: 'Di chuyển đi Hàng Châu, du thuyền Tây Hồ, thăm làng trà Long Tỉnh, thưởng thức trà xanh nổi tiếng.' },
      { title: 'Ngày 5: Tô Châu - Thượng Hải', content: 'Thăm Lâm viên Tô Châu, phố cổ Bình Giang. Về Thượng Hải dạo Bến Thượng Hải, phố Nam Kinh, ngắm tháp Minh Châu Phương Đông về đêm.' },
      { title: 'Ngày 6: Thượng Hải - Hà Nội', content: 'Tự do mua sắm, xe đưa đoàn ra sân bay về Hà Nội. Kết thúc chương trình.' },
    ],
    departures: deps(18990000, 'Vietnam Airlines', 8, 3),
  }),
  tour({
    slug: 'quang-chau-tham-quyen-4n3d', code: 'TS-CN03', category: 'china', tag: 'Giá tốt',
    title: 'Hà Nội - Quảng Châu - Thâm Quyến 4 ngày 3 đêm',
    destination: 'Quảng Châu', departFrom: 'Hà Nội', days: '4N3Đ', price: 9990000, oldPrice: 12990000, schedule: 'Hàng tuần',
    highlights: 'Tháp Quảng Châu - Sông Châu Giang - Đại lộ Bắc Kinh - Vĩnh Khánh Phường - Phố Đông Môn - Thị trấn hoa Hà Lan',
    images: [IMG('1539008783272-879419b3c424'), IMG('1563090162-6b4c2a20d658'), IMG('1583996829982-823143cc975a')],
    summary: 'Tour ngắn ngày lý tưởng để khám phá hai đô thị sầm uất bậc nhất Hoa Nam, kết hợp tham quan và mua sắm với lịch trình nhẹ nhàng.',
    itinerary: [
      { title: 'Ngày 1: Hà Nội - Quảng Châu', content: 'Đáp chuyến bay đi Quảng Châu. HDV đón đoàn về khách sạn nghỉ ngơi.' },
      { title: 'Ngày 2: Quảng Châu', content: 'Tham quan Vĩnh Khánh Phường, Đại lộ Bắc Kinh, quảng trường Hoa Thành.\nTối du thuyền sông Châu Giang ngắm tháp Quảng Châu rực rỡ.' },
      { title: 'Ngày 3: Thâm Quyến', content: 'Di chuyển đi Thâm Quyến, thăm thị trấn hoa Hà Lan, phố đi bộ Đông Môn, phố cổ Cam Khanh.' },
      { title: 'Ngày 4: Thâm Quyến - Quảng Châu - Hà Nội', content: 'Ăn sáng, ra sân bay Quảng Châu đáp chuyến bay về Hà Nội.' },
    ],
    departures: deps(9990000, 'Vietjet Air', 8, 5),
  }),
  tour({
    slug: 'le-giang-shangri-la-dai-ly-6n5d', code: 'TS-CN04', category: 'china', featured: true, tag: 'Cao cấp',
    title: 'Hà Nội - Côn Minh - Đại Lý - Lệ Giang - Shangri-La 6 ngày 5 đêm',
    destination: 'Lệ Giang', departFrom: 'Hà Nội', days: '6N5Đ', price: 16990000, oldPrice: 19490000, schedule: 'Thứ 6 hàng tuần',
    transport: 'Máy bay, tàu cao tốc, ô tô',
    highlights: 'Cổ trấn Lệ Giang - Núi tuyết Ngọc Long - Lam Nguyệt Cốc - Đại Lý cổ thành - Nhĩ Hải - Shangri-La - Tu viện Tùng Tán Lâm',
    images: [IMG('1561185367-7b959f3614f6'), IMG('1698562671605-1699bcc9ae85'), IMG('1568005508084-d289b79374f5'), IMG('1555302144-bf3f290c5fd5')],
    summary: 'Hành trình đến vùng đất “Đường chân trời đã mất” Shangri-La, chiêm ngưỡng núi tuyết Ngọc Long quanh năm phủ trắng và hồ nước xanh ngọc Lam Nguyệt Cốc.',
    itinerary: [
      { title: 'Ngày 1: Hà Nội - Côn Minh - Đại Lý', content: 'Bay đi Côn Minh, đáp tàu cao tốc đi Đại Lý. Nhận phòng nghỉ ngơi.' },
      { title: 'Ngày 2: Đại Lý cổ thành - Nhĩ Hải', content: 'Tham quan Tam Tháp Tự, Đại Lý cổ thành, đạp xe/đi bộ ven hồ Nhĩ Hải. Chiều đi Lệ Giang.' },
      { title: 'Ngày 3: Núi tuyết Ngọc Long - Lam Nguyệt Cốc', content: 'Cáp treo lên núi tuyết Ngọc Long, thưởng thức show Ấn Tượng Lệ Giang, tham quan Lam Nguyệt Cốc.' },
      { title: 'Ngày 4: Lệ Giang - Shangri-La', content: 'Đi Shangri-La, thăm tu viện Tùng Tán Lâm, cổ trấn Độc Khắc Tông với chiếc kinh luân lớn nhất thế giới.' },
      { title: 'Ngày 5: Shangri-La - Côn Minh', content: 'Tham quan Phổ Đạt Thố, về Côn Minh, dạo phố đi bộ Nam Bình.' },
      { title: 'Ngày 6: Côn Minh - Hà Nội', content: 'Ra sân bay đáp chuyến bay về Hà Nội.' },
    ],
    departures: deps(16990000, 'China Eastern', 6, 7),
  }),
  tour({
    slug: 'thanh-do-cuu-trai-cau-5n4d', code: 'TS-CN05', category: 'china', featured: true, tag: 'Mùa thu',
    title: 'TP. Hồ Chí Minh - Thành Đô - Cửu Trại Câu - Hoàng Long 5 ngày 4 đêm',
    destination: 'Cửu Trại Câu', departFrom: 'TP. Hồ Chí Minh', days: '5N4Đ', price: 19990000, oldPrice: 23990000, schedule: 'Thứ 7 hàng tuần',
    highlights: 'Cửu Trại Câu - Hồ Ngũ Sắc - Thác Nặc Nhật Lãng - Hoàng Long - Cơ sở nhân giống gấu trúc - Phố cổ Khoan Hẹp',
    images: [IMG('1635772512104-98695c3a73f1'), IMG('1596647832502-3e799e5bf5ff'), IMG('1540126034813-121bf29033d2')],
    summary: 'Ngắm “chốn bồng lai tiên cảnh” Cửu Trại Câu với hơn 100 hồ nước trong vắt đổi màu theo mùa và gặp gỡ những chú gấu trúc đáng yêu tại Thành Đô.',
    itinerary: [
      { title: 'Ngày 1: TP. Hồ Chí Minh - Thành Đô', content: 'Đáp chuyến bay đi Thành Đô. Ăn tối lẩu Tứ Xuyên, nhận phòng khách sạn.' },
      { title: 'Ngày 2: Thành Đô - Cửu Trại Câu', content: 'Đi Cửu Trại Câu bằng tàu cao tốc. Trên đường ngắm cảnh núi non Tứ Xuyên hùng vĩ.' },
      { title: 'Ngày 3: Khu thắng cảnh Cửu Trại Câu', content: 'Cả ngày khám phá Cửu Trại Câu: Hồ Ngũ Sắc, Hồ Trường, thác Nặc Nhật Lãng, Hồ Gương, Biển Gấu Trúc.' },
      { title: 'Ngày 4: Hoàng Long - Thành Đô', content: 'Tham quan Hoàng Long với ruộng bậc thang đá vôi vàng óng. Về Thành Đô dạo phố cổ Khoan Hẹp.' },
      { title: 'Ngày 5: Gấu trúc - TP. Hồ Chí Minh', content: 'Thăm cơ sở nhân giống gấu trúc lớn Thành Đô, ra sân bay về TP. Hồ Chí Minh.' },
    ],
    departures: deps(19990000, 'Sichuan Airlines', 6, 7),
  }),
  tour({
    slug: 'con-minh-thach-lam-kieu-tu-4n3d', code: 'TS-CN06', category: 'china', tag: 'Tiết kiệm',
    title: 'Hà Nội - Côn Minh - Thạch Lâm - Núi tuyết Kiệu Tử 4 ngày 3 đêm',
    destination: 'Côn Minh', departFrom: 'Hà Nội', days: '4N3Đ', price: 6990000, oldPrice: 7990000, schedule: 'Thứ 4 hàng tuần',
    highlights: 'Rừng đá Thạch Lâm - Núi tuyết Kiệu Tử - Cổ trấn Quan Độ - Hồ Điền Trì - Phố đi bộ Nam Bình',
    images: [IMG('1711886943210-beca23793689'), IMG('1711887289728-345697059adb'), IMG('1555302144-bf3f290c5fd5')],
    summary: 'Hành trình giá mềm khám phá “thành phố mùa xuân” Côn Minh, rừng đá Thạch Lâm kỳ thú và núi tuyết Kiệu Tử trắng xóa.',
    itinerary: [
      { title: 'Ngày 1: Hà Nội - Côn Minh', content: 'Bay đi Côn Minh, HDV đón đoàn, tham quan cổ trấn Quan Độ.' },
      { title: 'Ngày 2: Núi tuyết Kiệu Tử', content: 'Đi cáp treo lên núi tuyết Kiệu Tử, ngắm thác băng và biển mây.' },
      { title: 'Ngày 3: Rừng đá Thạch Lâm', content: 'Tham quan Thạch Lâm - di sản thiên nhiên thế giới. Tối dạo phố Nam Bình.' },
      { title: 'Ngày 4: Côn Minh - Hà Nội', content: 'Dạo hồ Điền Trì, ra sân bay về Hà Nội.' },
    ],
    departures: deps(6990000, 'Vietjet Air', 8, 4),
  }),
  tour({
    slug: 'trung-khanh-vu-long-5n4d', code: 'TS-CN07', category: 'china', tag: 'Mới',
    title: 'TP. Hồ Chí Minh - Trùng Khánh - Vũ Long - Hồng Nhai Động 5 ngày 4 đêm',
    destination: 'Trùng Khánh', departFrom: 'TP. Hồ Chí Minh', days: '5N4Đ', price: 14490000, oldPrice: 16990000, schedule: 'Hàng tuần',
    highlights: 'Hồng Nhai Động - Thiên Sinh Tam Kiều (Vũ Long) - Cáp treo sông Trường Giang - Phố cổ Từ Khí Khẩu - Giải Phóng Bi',
    images: [IMG('1581252584837-95f73fd23574'), IMG('1581252167648-643051a9433e'), IMG('1567014688543-cc4abffb061a')],
    summary: 'Khám phá “thành phố 8D” Trùng Khánh với những tòa nhà có tàu điện chạy xuyên qua, Hồng Nhai Động lung linh như phim hoạt hình và kỳ quan Vũ Long.',
    itinerary: [
      { title: 'Ngày 1: TP. Hồ Chí Minh - Trùng Khánh', content: 'Bay đi Trùng Khánh, nhận phòng khách sạn.' },
      { title: 'Ngày 2: Vũ Long', content: 'Tham quan Thiên Sinh Tam Kiều - bối cảnh phim Hoàng Kim Giáp, Long Thủy Hạp Địa Phùng.' },
      { title: 'Ngày 3: Trùng Khánh 8D', content: 'Ngắm tàu điện Lý Tử Bá xuyên tòa nhà, đi cáp treo qua sông Trường Giang, tối ngắm Hồng Nhai Động.' },
      { title: 'Ngày 4: Phố cổ Từ Khí Khẩu', content: 'Dạo phố cổ Từ Khí Khẩu, Giải Phóng Bi, thưởng thức lẩu cay Trùng Khánh.' },
      { title: 'Ngày 5: Trùng Khánh - TP. Hồ Chí Minh', content: 'Ra sân bay về TP. Hồ Chí Minh.' },
    ],
    departures: deps(14490000, 'Vietjet Air', 6, 8),
  }),
  tour({
    slug: 'ha-khau-con-minh-mong-tu-duong-bo-4n3d', code: 'TS-CN08', category: 'china', tag: 'Đường bộ',
    title: 'Lào Cai - Hà Khẩu - Mông Tự - Kiến Thủy - Côn Minh 4 ngày 3 đêm (đường bộ)',
    destination: 'Côn Minh', departFrom: 'Hà Nội', days: '4N3Đ', price: 5490000, oldPrice: 6490000, schedule: 'Thứ 7 hàng tuần',
    hotel: 'Khách sạn 3-4 sao', transport: 'Ô tô, tàu cao tốc',
    highlights: 'Cửa khẩu Hà Khẩu - Bích Sắc Trại - Cổ thành Kiến Thủy - Cầu Song Long - Côn Minh',
    images: [IMG('1711887289728-345697059adb'), IMG('1569165755139-296fac054979'), IMG('1464817739973-0128fe77aaa1')],
    summary: 'Không cần hộ chiếu - đi bằng giấy thông hành qua cửa khẩu Lào Cai, tiết kiệm chi phí mà vẫn khám phá trọn vẹn Vân Nam.',
    includes: ['Xe giường nằm Hà Nội - Lào Cai khứ hồi', 'Giấy thông hành nhập cảnh Trung Quốc', 'Khách sạn 3-4 sao, 2 người/phòng', 'Các bữa ăn theo chương trình', 'Vé tàu cao tốc, xe tham quan', 'HDV tiếng Việt suốt tuyến', 'Bảo hiểm du lịch'],
    itinerary: [
      { title: 'Ngày 1: Hà Nội - Lào Cai - Hà Khẩu - Mông Tự', content: 'Xe đón đoàn đi Lào Cai, làm thủ tục qua cửa khẩu Hà Khẩu, đi Mông Tự, thăm Bích Sắc Trại.' },
      { title: 'Ngày 2: Kiến Thủy cổ thành', content: 'Tham quan cổ thành Kiến Thủy, cầu Song Long, Chu Gia Hoa Viên. Tàu cao tốc đi Côn Minh.' },
      { title: 'Ngày 3: Côn Minh', content: 'Tham quan Thạch Lâm, phố đi bộ Nam Bình, chợ hoa Đẩu Nam.' },
      { title: 'Ngày 4: Côn Minh - Hà Khẩu - Hà Nội', content: 'Tàu cao tốc về Hà Khẩu, qua cửa khẩu về Lào Cai, xe đưa về Hà Nội.' },
    ],
    departures: deps(5490000, 'Đường bộ', 8, 7),
  }),
  tour({
    slug: 'thuong-hai-o-tran-hang-chau-5n4d', code: 'TS-CN09', category: 'china', tag: 'Giá tốt',
    title: 'TP. Hồ Chí Minh - Thượng Hải - Hàng Châu - Ô Trấn 5 ngày 4 đêm',
    destination: 'Bắc Kinh - Thượng Hải', departFrom: 'TP. Hồ Chí Minh', days: '5N4Đ', price: 10990000, oldPrice: 14990000, schedule: 'Hàng tuần',
    highlights: 'Bến Thượng Hải - Tháp Minh Châu - Ô Trấn - Tây Hồ - Thành Hoàng Miếu - Disneyland (tự chọn)',
    images: [IMG('1474181487882-5abf3f0ba6c2'), IMG('1583852806497-745221a72557'), IMG('1558422719-d6982435e4e4')],
    summary: 'Ghé thăm “Venice phương Đông” Ô Trấn, du thuyền Tây Hồ thơ mộng và ngắm Thượng Hải hoa lệ - hành trình Giang Nam đầy chất thơ.',
    itinerary: [
      { title: 'Ngày 1: TP. Hồ Chí Minh - Thượng Hải', content: 'Bay đêm đi Thượng Hải, nhận phòng nghỉ ngơi.' },
      { title: 'Ngày 2: Ô Trấn', content: 'Khám phá thủy trấn Ô Trấn với những con kênh, cây cầu đá cổ. Ngủ đêm trong cổ trấn.' },
      { title: 'Ngày 3: Hàng Châu - Tây Hồ', content: 'Du thuyền Tây Hồ, Tô Đê, Lôi Phong Tháp. Thưởng thức trà Long Tỉnh.' },
      { title: 'Ngày 4: Thượng Hải', content: 'Thành Hoàng Miếu, Dự Viên, Bến Thượng Hải, phố Nam Kinh. Tối ngắm sông Hoàng Phố.' },
      { title: 'Ngày 5: Thượng Hải - TP. Hồ Chí Minh', content: 'Tự do mua sắm, ra sân bay về TP. Hồ Chí Minh.' },
    ],
    departures: deps(10990000, 'Sun PhuQuoc Airways', 8, 5),
  }),
  tour({
    slug: 'tan-cuong-8n7d', code: 'TS-CN10', category: 'china', tag: 'Khám phá',
    title: 'Hà Nội - Urumqi - Kanas - Hồ Thiên Trì - Tân Cương 8 ngày 7 đêm',
    destination: 'Tân Cương', departFrom: 'Hà Nội', days: '8N7Đ', price: 42990000, oldPrice: 49990000, schedule: 'Hàng tháng',
    highlights: 'Hồ Kanas - Làng Hòa Mộc - Hồ Thiên Trì - Đồng cỏ Nalati - Hẻm núi Độc Sơn Tử - Chợ lớn Urumqi',
    images: [IMG('1621765458937-9d5bbe871304'), IMG('1569660003459-6c30601dc19c')],
    summary: 'Hành trình đến miền viễn Tây Trung Quốc với những đồng cỏ bất tận, hồ Kanas xanh ngọc và mùa thu vàng rực tại làng Hòa Mộc.',
    itinerary: [
      { title: 'Ngày 1: Hà Nội - Urumqi', content: 'Bay đi Urumqi qua điểm nối chuyến, nhận phòng nghỉ ngơi.' },
      { title: 'Ngày 2: Urumqi - Hồ Thiên Trì', content: 'Tham quan hồ Thiên Trì dưới chân núi Bogda, chiều về khách sạn.' },
      { title: 'Ngày 3-4: Kanas - Làng Hòa Mộc', content: 'Khám phá hồ Kanas, vịnh Nguyệt Lượng, vịnh Thần Tiên; ngắm bình minh làng Hòa Mộc.' },
      { title: 'Ngày 5-6: Hẻm núi Độc Sơn Tử - Nalati', content: 'Chiêm ngưỡng hẻm núi Độc Sơn Tử, thảo nguyên Nalati bao la.' },
      { title: 'Ngày 7: Urumqi', content: 'Về Urumqi, dạo chợ lớn quốc tế, thưởng thức ẩm thực Duy Ngô Nhĩ.' },
      { title: 'Ngày 8: Urumqi - Hà Nội', content: 'Ra sân bay về Hà Nội.' },
    ],
    departures: deps(42990000, 'China Southern', 4, 12),
  }),
  tour({
    slug: 'que-lam-duong-soc-4n3d', code: 'TS-CN11', category: 'china', tag: 'Thiên nhiên',
    title: 'Hà Nội - Nam Ninh - Quế Lâm - Dương Sóc 4 ngày 3 đêm',
    destination: 'Quế Lâm', departFrom: 'Hà Nội', days: '4N3Đ', price: 7490000, oldPrice: 8990000, schedule: 'Thứ 5 hàng tuần',
    transport: 'Ô tô, tàu cao tốc',
    highlights: 'Du thuyền sông Ly - Dương Sóc - Tây Nhai - Hang Sáo Lau - Núi Voi - Show Ấn Tượng Lưu Tam Tỷ',
    images: [IMG('1537531383496-f4749b8032cf'), IMG('1625820006199-2d9dacffa53a'), IMG('1600623305065-140c9031f631')],
    summary: '“Quế Lâm sơn thủy giáp thiên hạ” - bức tranh thủy mặc sống động với sông Ly uốn lượn giữa những ngọn núi đá vôi.',
    itinerary: [
      { title: 'Ngày 1: Hà Nội - Hữu Nghị Quan - Nam Ninh', content: 'Xe đưa đoàn lên cửa khẩu Hữu Nghị, qua Bằng Tường đi Nam Ninh.' },
      { title: 'Ngày 2: Nam Ninh - Quế Lâm', content: 'Tàu cao tốc đi Quế Lâm, tham quan Núi Voi, hang Sáo Lau.' },
      { title: 'Ngày 3: Sông Ly - Dương Sóc', content: 'Du thuyền sông Ly đến Dương Sóc, dạo phố Tây Nhai, xem show Ấn Tượng Lưu Tam Tỷ.' },
      { title: 'Ngày 4: Quế Lâm - Hà Nội', content: 'Tàu cao tốc về Nam Ninh, xe đưa đoàn về Hà Nội.' },
    ],
    departures: deps(7490000, 'Đường bộ', 8, 5),
  }),
  tour({
    slug: 'hong-kong-ma-cao-tham-quyen-5n4d', code: 'TS-HK01', category: 'china', tag: 'Mua sắm',
    title: 'Hà Nội - Hồng Kông - Ma Cao - Thâm Quyến 5 ngày 4 đêm',
    destination: 'Hồng Kông', departFrom: 'Hà Nội', days: '5N4Đ', price: 15990000, oldPrice: 18490000, schedule: 'Hàng tuần',
    highlights: 'Đỉnh Victoria - Vịnh Repulse - Đại lộ Ngôi sao - Tàn tích Thánh Paul - Venetian Macao - Cầu Hồng Kông - Châu Hải - Ma Cao',
    images: [IMG('1536599018102-9f803c140fc1'), IMG('1620015092538-e33c665fc181')],
    summary: 'Ba điểm đến trong một hành trình: Hồng Kông sôi động, Ma Cao xa hoa và Thâm Quyến hiện đại, đi qua cây cầu vượt biển dài nhất thế giới.',
    itinerary: [
      { title: 'Ngày 1: Hà Nội - Hồng Kông', content: 'Bay đi Hồng Kông, ngắm Đại lộ Ngôi sao và vịnh Victoria về đêm.' },
      { title: 'Ngày 2: Hồng Kông', content: 'Lên đỉnh Victoria, vịnh Repulse, miếu Hoàng Đại Tiên. Tự do mua sắm tại Tiêm Sa Chủy.' },
      { title: 'Ngày 3: Ma Cao', content: 'Qua cầu Hồng Kông - Châu Hải - Ma Cao, thăm tàn tích Thánh Paul, quảng trường Senado, Venetian.' },
      { title: 'Ngày 4: Thâm Quyến', content: 'Đi Thâm Quyến, tham quan Thế Giới Thu Nhỏ, phố Đông Môn.' },
      { title: 'Ngày 5: Hồng Kông - Hà Nội', content: 'Ra sân bay Hồng Kông về Hà Nội.' },
    ],
    departures: deps(15990000, 'Vietnam Airlines', 6, 6),
  }),
  // ---- Châu Á khác ----
  tour({
    slug: 'han-quoc-seoul-nami-everland-5n4d', code: 'TS-KR01', category: 'asia', tag: 'Bán chạy',
    title: 'Hà Nội - Seoul - Đảo Nami - Everland 5 ngày 4 đêm', destination: 'Hàn Quốc', departFrom: 'Hà Nội', days: '5N4Đ',
    price: 11990000, oldPrice: 15990000, schedule: 'Hàng tuần', highlights: 'Cung Gyeongbok - Đảo Nami - Everland - Tháp Namsan - Myeongdong',
    images: [IMG('1538485399081-7191377e8241'), IMG('1546874177-9e664107314e')],
    summary: 'Hàn Quốc mùa lá vàng với đảo Nami thơ mộng, công viên Everland và mặc Hanbok dạo cung điện Gyeongbok.',
    includes: ['Vé máy bay khứ hồi', 'Visa Hàn Quốc', 'Khách sạn 3-4 sao', 'Ăn uống theo chương trình', 'HDV tiếng Việt', 'Bảo hiểm du lịch'],
    itinerary: [
      { title: 'Ngày 1: Hà Nội - Incheon', content: 'Bay đêm đi Incheon.' },
      { title: 'Ngày 2: Đảo Nami', content: 'Tham quan đảo Nami, làm kim chi, mặc Hanbok.' },
      { title: 'Ngày 3: Everland', content: 'Vui chơi cả ngày tại công viên Everland.' },
      { title: 'Ngày 4: Seoul', content: 'Cung Gyeongbok, tháp Namsan, mua sắm Myeongdong.' },
      { title: 'Ngày 5: Seoul - Hà Nội', content: 'Ra sân bay về Hà Nội.' },
    ],
    departures: deps(11990000, 'Vietjet Air', 6, 4),
  }),
  tour({
    slug: 'nhat-ban-tokyo-phu-si-kyoto-osaka-6n5d', code: 'TS-JP01', category: 'asia', featured: true, tag: 'Hot',
    title: 'Hà Nội - Tokyo - Núi Phú Sĩ - Kyoto - Osaka 6 ngày 5 đêm', destination: 'Nhật Bản', departFrom: 'Hà Nội', days: '6N5Đ',
    price: 28990000, oldPrice: 33990000, schedule: 'Hàng tuần', transport: 'Máy bay, tàu Shinkansen, ô tô',
    highlights: 'Chùa Asakusa - Núi Phú Sĩ - Làng cổ Oshino Hakkai - Kyoto - Chùa Thanh Thủy - Lâu đài Osaka',
    images: [IMG('1490806843957-31f4c9a91c65'), IMG('1493976040374-85c8e12f0c0e')],
    summary: 'Cung đường vàng Nhật Bản từ Tokyo hiện đại, núi Phú Sĩ linh thiêng đến cố đô Kyoto và Osaka náo nhiệt.',
    includes: ['Vé máy bay khứ hồi', 'Visa Nhật Bản', 'Khách sạn 4 sao', 'Ăn uống theo chương trình', 'Trải nghiệm tàu Shinkansen', 'HDV tiếng Việt', 'Bảo hiểm du lịch'],
    itinerary: [
      { title: 'Ngày 1: Hà Nội - Tokyo', content: 'Bay đêm đi Tokyo.' },
      { title: 'Ngày 2: Tokyo', content: 'Chùa Asakusa, tháp Skytree, Ginza.' },
      { title: 'Ngày 3: Núi Phú Sĩ', content: 'Núi Phú Sĩ trạm 5, làng cổ Oshino Hakkai, tắm Onsen.' },
      { title: 'Ngày 4: Kyoto', content: 'Shinkansen đi Kyoto, chùa Thanh Thủy, đền Fushimi Inari.' },
      { title: 'Ngày 5: Osaka', content: 'Lâu đài Osaka, phố Shinsaibashi, Dotonbori.' },
      { title: 'Ngày 6: Osaka - Hà Nội', content: 'Ra sân bay Kansai về Hà Nội.' },
    ],
    departures: deps(28990000, 'Vietnam Airlines', 6, 5),
  }),
  tour({
    slug: 'dai-loan-dai-bac-dai-trung-cao-hung-5n4d', code: 'TS-TW01', category: 'asia', tag: 'Miễn visa',
    title: 'Hà Nội - Đài Bắc - Đài Trung - Cao Hùng 5 ngày 4 đêm', destination: 'Đài Loan', departFrom: 'Hà Nội', days: '5N4Đ',
    price: 10990000, oldPrice: 12990000, schedule: 'Hàng tuần', highlights: 'Cửu Phần - Thập Phần - Hồ Nhật Nguyệt - Tháp 101 - Chợ đêm Sỹ Lâm',
    images: [IMG('1571474004502-c1def214ac6d'), IMG('1567082891623-b2be518a62bc')],
    summary: 'Thả đèn trời ở Thập Phần, lạc bước phố cổ Cửu Phần và du thuyền hồ Nhật Nguyệt.',
    includes: ['Vé máy bay khứ hồi', 'Visa Đài Loan', 'Khách sạn 3-4 sao', 'Ăn uống theo chương trình', 'HDV tiếng Việt', 'Bảo hiểm du lịch'],
    itinerary: [
      { title: 'Ngày 1: Hà Nội - Cao Hùng', content: 'Bay đi Cao Hùng, tham quan Đầm Liên Trì.' },
      { title: 'Ngày 2: Đài Trung - Hồ Nhật Nguyệt', content: 'Du thuyền hồ Nhật Nguyệt, chùa Văn Võ.' },
      { title: 'Ngày 3: Đài Bắc', content: 'Thập Phần thả đèn trời, phố cổ Cửu Phần.' },
      { title: 'Ngày 4: Đài Bắc', content: 'Tháp 101, Trung Chính Kỷ Niệm Đường, chợ đêm Sỹ Lâm.' },
      { title: 'Ngày 5: Đài Bắc - Hà Nội', content: 'Ra sân bay về Hà Nội.' },
    ],
    departures: deps(10990000, 'Vietjet Air', 6, 6),
  }),
  // ---- Trong nước ----
  tour({
    slug: 'ha-long-du-thuyen-5-sao-2n1d', code: 'TS-VN01', category: 'domestic', tag: 'Combo',
    title: 'Hạ Long - Du thuyền 5 sao - Vịnh Lan Hạ 2 ngày 1 đêm', destination: 'Hạ Long', departFrom: 'Hà Nội', days: '2N1Đ',
    price: 2890000, oldPrice: 3490000, schedule: 'Hàng ngày', hotel: 'Du thuyền 5 sao', transport: 'Xe Limousine, du thuyền',
    highlights: 'Hang Sửng Sốt - Đảo Ti Tốp - Chèo kayak - Vịnh Lan Hạ', images: [IMG('1528127269322-539801943592')],
    summary: 'Nghỉ đêm trên du thuyền 5 sao giữa di sản thiên nhiên thế giới vịnh Hạ Long.',
    includes: ['Xe Limousine đón tiễn Hà Nội', 'Cabin du thuyền 5 sao', 'Các bữa ăn trên du thuyền', 'Vé thăm quan vịnh', 'Kayak, lớp Thái Cực Quyền buổi sáng'],
    excludes: ['Đồ uống, spa', 'Chi phí cá nhân'], childPolicy: CHILD, notes: ['Đặt trước ít nhất 3 ngày'],
    itinerary: [
      { title: 'Ngày 1: Hà Nội - Hạ Long', content: 'Xe Limousine đón tại phố cổ, lên du thuyền, ăn trưa, thăm hang Sửng Sốt, chèo kayak.' },
      { title: 'Ngày 2: Hạ Long - Hà Nội', content: 'Tập Thái Cực Quyền đón bình minh, đảo Ti Tốp, ăn trưa và trở về Hà Nội.' },
    ],
    departures: deps(2890000, 'Xe Limousine', 8, 2),
  }),
  tour({
    slug: 'sapa-fansipan-3n2d', code: 'TS-VN02', category: 'domestic', tag: 'Săn mây',
    title: 'Hà Nội - Sapa - Fansipan - Bản Cát Cát 3 ngày 2 đêm', destination: 'Sapa', departFrom: 'Hà Nội', days: '3N2Đ',
    price: 2490000, oldPrice: 2990000, schedule: 'Thứ 6 hàng tuần', hotel: 'Khách sạn 3 sao', transport: 'Xe giường nằm',
    highlights: 'Đỉnh Fansipan - Bản Cát Cát - Đèo Ô Quy Hồ - Cầu kính Rồng Mây', images: [IMG('1570366583862-f91883984fde'), IMG('1531737212413-667205e1cda7')],
    summary: 'Chinh phục “nóc nhà Đông Dương” và săn mây trên đèo Ô Quy Hồ.',
    includes: ['Xe giường nằm khứ hồi', 'Khách sạn 3 sao', 'Ăn theo chương trình', 'HDV', 'Bảo hiểm'], excludes: ['Vé cáp treo Fansipan', 'Chi phí cá nhân'],
    itinerary: [
      { title: 'Ngày 1: Hà Nội - Sapa', content: 'Xe đón đi Sapa, chiều thăm bản Cát Cát.' },
      { title: 'Ngày 2: Fansipan', content: 'Cáp treo lên đỉnh Fansipan, chiều đèo Ô Quy Hồ, cầu kính Rồng Mây.' },
      { title: 'Ngày 3: Sapa - Hà Nội', content: 'Tự do dạo chợ Sapa, xe đưa về Hà Nội.' },
    ],
    departures: deps(2490000, 'Xe giường nằm', 8, 6),
  }),
];

const D = (name, region, img, order) => ({ id: id(), name, region, image: IMG(img).replace('w=1600', 'w=900'), featured: true, order });
const destinations = [
  D('Trương Gia Giới', 'china', '1567266565446-d9c40ccf59a4', 1),
  D('Phượng Hoàng Cổ Trấn', 'china', '1520746023174-87501e47217c', 2),
  D('Bắc Kinh - Thượng Hải', 'china', '1608037521277-154cd1b89191', 3),
  D('Lệ Giang', 'china', '1561185367-7b959f3614f6', 4),
  D('Cửu Trại Câu', 'china', '1635772512104-98695c3a73f1', 5),
  D('Trùng Khánh', 'china', '1581252167648-643051a9433e', 6),
  D('Quế Lâm', 'china', '1537531383496-f4749b8032cf', 7),
  D('Côn Minh', 'china', '1711886943210-beca23793689', 8),
  D('Quảng Châu', 'china', '1539008783272-879419b3c424', 9),
  D('Tân Cương', 'china', '1621765458937-9d5bbe871304', 10),
  D('Hồng Kông', 'china', '1536599018102-9f803c140fc1', 11),
  D('Nhật Bản', 'asia', '1490806843957-31f4c9a91c65', 12),
  D('Hàn Quốc', 'asia', '1546874177-9e664107314e', 13),
  D('Đài Loan', 'asia', '1571474004502-c1def214ac6d', 14),
  D('Hạ Long', 'domestic', '1528127269322-539801943592', 15),
  D('Sapa', 'domestic', '1570366583862-f91883984fde', 16),
  D('Hà Giang', 'domestic', '1536511671359-849531c0a576', 17),
];

const posts = [
  { id: id(), slug: 'xin-visa-trung-quoc-co-kho-khong', title: 'Xin visa Trung Quốc có khó không? Giải đáp từ A-Z', image: IMG('1577706881850-bf7c7d8906a5'), excerpt: 'Hồ sơ cần chuẩn bị, thời gian xét duyệt, visa đoàn và visa cá nhân khác nhau thế nào — tất cả trong một bài.', content: 'Visa Trung Quốc hiện có hai hình thức phổ biến cho khách du lịch: visa đoàn (đi theo tour) và visa cá nhân.\n\nVisa đoàn: Quý khách chỉ cần gửi ảnh hộ chiếu còn hạn trên 6 tháng, Lumi Travel sẽ lo toàn bộ thủ tục. Thời gian xét duyệt khoảng 5-7 ngày làm việc.\n\nVisa cá nhân: cần tờ khai, ảnh 4x6 nền trắng, xác nhận công việc, sao kê tài khoản và lịch trình chuyến đi.\n\nĐi đường bộ qua Lào Cai, Lạng Sơn: có thể dùng giấy thông hành thay hộ chiếu, rất tiện lợi cho tour ngắn ngày.', published: true, createdAt: now - 2 * 864e5 },
  { id: id(), slug: 'truong-gia-gioi-mua-nao-dep-nhat', title: 'Trương Gia Giới mùa nào đẹp nhất? Kinh nghiệm từ A-Z', image: IMG('1546707640-7ba6e4b2df2e'), excerpt: 'Mùa xuân mây phủ, mùa thu lá đỏ — chọn thời điểm vàng để ngắm rừng cột đá Avatar.', content: 'Trương Gia Giới đẹp quanh năm nhưng thời điểm lý tưởng nhất là tháng 4-5 và tháng 9-11.\n\nMùa xuân: mây mù bao phủ các cột đá tạo cảnh tiên cảnh huyền ảo.\nMùa thu: thời tiết mát mẻ, lá chuyển vàng đỏ rực rỡ.\nMùa đông: có thể gặp tuyết, cảnh sắc trắng xóa nhưng một số tuyến đường đóng cửa.\n\nLưu ý mang giày thể thao, áo khoác mỏng và sạc dự phòng.', published: true, createdAt: now - 5 * 864e5 },
  { id: id(), slug: 'cuu-trai-cau-4-mua-tien-canh', title: 'Đi Cửu Trại Câu mùa nào đẹp nhất? Review 4 mùa tiên cảnh', image: IMG('1596647832502-3e799e5bf5ff'), excerpt: 'Hơn 100 hồ nước đổi màu theo mùa — đâu là thời điểm hồ Ngũ Sắc rực rỡ nhất?', content: 'Cửu Trại Câu nằm ở tỉnh Tứ Xuyên, nổi tiếng với những hồ nước trong vắt nhiều màu sắc.\n\nTháng 10 là thời điểm đẹp nhất khi lá rừng chuyển đỏ vàng phản chiếu xuống mặt hồ.\n\nNên dành trọn một ngày trong khu thắng cảnh, đi xe bus nội khu và đi bộ theo các tuyến ván gỗ.', published: true, createdAt: now - 9 * 864e5 },
  { id: id(), slug: 'du-lich-trung-quoc-khong-biet-tieng-trung', title: 'Không biết tiếng Trung có du lịch Trung Quốc được không?', image: IMG('1545893835-abaa50cbe628'), excerpt: 'Ứng dụng cần cài, cách thanh toán, cách dùng mạng xã hội khi ở Trung Quốc.', content: 'Hoàn toàn được! Một số mẹo hữu ích:\n\n• Cài Alipay hoặc WeChat Pay liên kết thẻ quốc tế để thanh toán.\n• Dùng ứng dụng dịch có chế độ chụp ảnh để đọc menu, biển báo.\n• Mua SIM/eSIM quốc tế trước khi đi để truy cập Google, Facebook.\n• Đi theo tour có HDV tiếng Việt để an tâm nhất.', published: true, createdAt: now - 14 * 864e5 },
];

const reviews = [
  { id: id(), name: 'Chị Lan Anh', trip: 'Trương Gia Giới 5N4Đ', text: 'Cảnh đẹp ngoài sức tưởng tượng, HDV nhiệt tình chu đáo. Đồ ăn hợp khẩu vị người Việt, cả nhà rất hài lòng!', rating: 5, published: true },
  { id: id(), name: 'Anh Quốc Huy', trip: 'Bắc Kinh - Thượng Hải 6N5Đ', text: 'Lịch trình hợp lý, đi tàu cao tốc rất thú vị. Visa được Lumi Travel lo hết, mình chỉ việc xách vali lên đường.', rating: 5, published: true },
  { id: id(), name: 'Gia đình chị Thảo', trip: 'Lệ Giang - Shangri-La', text: 'Núi tuyết Ngọc Long đẹp mê hồn. Khách sạn tốt, xe rộng rãi. Bé nhà mình cực thích.', rating: 5, published: true },
  { id: id(), name: 'Anh Tuấn', trip: 'Cửu Trại Câu mùa thu', text: 'Đi đúng mùa lá đỏ, đẹp như tranh. Cảm ơn bạn tư vấn viên đã chọn thời điểm quá chuẩn!', rating: 5, published: true },
  { id: id(), name: 'Chị Hà My', trip: 'Côn Minh - Thạch Lâm', text: 'Giá mềm mà dịch vụ không hề kém. Sẽ giới thiệu bạn bè đi cùng Lumi Travel.', rating: 5, published: true },
  { id: id(), name: 'Team Công ty ABC', trip: 'Quảng Châu - Thâm Quyến', text: 'Đoàn 30 người được tổ chức chuyên nghiệp, gala dinner ấn tượng. Rất đáng tiền.', rating: 5, published: true },
  { id: id(), name: 'Bác Hùng', trip: 'Phượng Hoàng Cổ Trấn', text: 'Người lớn tuổi đi vẫn thoải mái, HDV chăm sóc từng chút. Phố cổ về đêm đẹp lắm.', rating: 5, published: true },
  { id: id(), name: 'Chị Ngọc', trip: 'Hồng Kông - Ma Cao', text: 'Mua sắm thả ga, lịch trình không quá dày. Lần sau sẽ đi tiếp tour Trương Gia Giới.', rating: 5, published: true },
];

module.exports = {
  settings: {
    companyName: 'Công ty TNHH Lumi Travel',
    brand: 'Lumi Travel',
    slogan: 'Khám phá thế giới - trọn vẹn hành trình',
    // Bản demo: để trống số điện thoại / Zalo / email — điền trong Admin → Cài đặt khi dùng thật.
    hotline: '',
    hotlineName: '',
    reportPhone: '',
    email: '',
    zalo: '',
    facebook: '',
    license: '',
    heroTitle: 'Bạn đang muốn đi đâu?',
    heroSubtitle: 'Chuyên tour Trung Quốc trọn gói — Trương Gia Giới, Phượng Hoàng, Bắc Kinh, Thượng Hải, Lệ Giang, Cửu Trại Câu… Visa nhanh, giá tốt mỗi ngày.',
    heroImages: [IMG('1514920735211-8c697444a248'), IMG('1508804185872-d7badad00f7d'), IMG('1520745947248-e287a72ed646'), IMG('1635772512104-98695c3a73f1'), IMG('1538428494232-9c0d8a3ab403')],
    aboutText: 'Lumi Travel mang đến những hành trình Trung Quốc được chuẩn bị kỹ lưỡng — từ visa, vé máy bay, khách sạn đến từng bữa ăn hợp khẩu vị người Việt. Đội ngũ hướng dẫn viên am hiểu văn hóa, đồng hành cùng bạn trên mọi cung đường.',
    visaText: 'Visa đoàn Trung Quốc chỉ cần ảnh hộ chiếu. Visa cá nhân, giấy thông hành đường bộ — Lumi Travel lo trọn gói, tỷ lệ đậu cao.',
    stats: [{ value: 12000, suffix: '+', label: 'Khách hàng' }, { value: 35, suffix: '+', label: 'Tuyến Trung Quốc' }, { value: 98, suffix: '%', label: 'Visa đậu lần đầu' }, { value: 4.9, suffix: '★', label: 'Đánh giá' }],
    addresses: [
      { label: 'Văn phòng', text: 'Địa chỉ văn phòng của bạn (cập nhật trong Admin → Cài đặt)', phone: '' },
    ],
  },
  tours, destinations, posts, reviews,
  bookings: [], subscribers: [],
};
