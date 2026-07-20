Giờ chúng ta update lại giao diện trang admin nha, 
Quản lý khách hàng:
- danh sách khách hàng: ở chỗ thao tác bạn hãy thêm một button chi tiết, sau khi click vào đó sẽ hiển thị tất cả thông tin về khách hàng, như ảnh, quê quán số căn cước, ảnh căn cước...
- đăng ký khách hàng thay đổi thời gian (tháng) thành -> thời gian (ngày), và trong thẻ select sẽ hiển thị từ 1 đến 30 ngày
- xem sự thay đổi: khi click vào chi tiết thì mình muốn bạn hiển thị nó theo dạnh list (danh sách ý)
- khách hàng hết hạn: thì cập nhật thêm button chi tiết như trong danh sách khách hàng
Quản lý thiết  bị: 
- Thêm thiết bị: bạn hãy sửa chỗ tổng tiền thành ô input để tự nhập giá tiền nha
Quản lý gói tập:
- danh sách gói tập: Bạn sẽ lấy phần chọn bộ môn và các gói tập của trang gói tập bên ngoài chỗ trang chủ ý, sau đó góc bên phải trên cùng hiển thị trang thái hoạt động hoặc tạm ngưng, thay cái ô chi tiết hoặc đăng ký ngay thành 3 nút sửa, xoá, nút thứ 3 là hiển thị tạm ngưng click lần thứ nhất nút sẽ biến đổi thành kich hoạt đồng thời góc gói tập chỗ trạng thái cũng biến đổi từ hoạt động thành tạm ngưng, sau khi nút là kích hoạt click lần nữa thì sẽ khổi phục lại ban đầu
- Thêm gói tập: sang một page mới hiển thị form trong đó có tên gói tập, loại gói(hiển thị các bộ môn), đơn giá gói theo tháng, một thẻ input dạng text kèm theo dấu cộng, mỗi khi click vào dấu công sẽ hiển thị thêm một input, một trường dữ liệu là chọn thời gian tập, sẽ có 2 nút input (viết số tháng, viết số phần trăm giảm giá) cũng có dấu cộng, mỗi khi click vào dấu cộng sẽ hiển thị thêm 2 nút input đó, Tiếp theo là 3 thẻ textarea, gồm có(cam kết bên A, cam kết bên B, điều khoản khác)
- danh sách hợp đồng, sẽ hiển thị các hợp đồng gắn liền với từng gói tập khác nhau, với nút sửa xoá,
Khi click vào nút sửa thì sẽ sang page mới hiển thị form có 3 thẻ textarea, gồm có(cam kết bên A, cam kết bên B, điều khoản khác)
Quản lý dịch vụ: 
- danh sách dịch vụ: sẽ hiển thị các yêu cầu dịch vụ đến từ hội viên ví dụ hội viên yêu cầu chuyển cơ sở phòng tập thì sẽ hiển thị, Lý do cùng với cơ sở mà hội viên muốn chuyển đến, sau đó có hai nút chấp nhận hoặc từ chối
- Lịch sử dịch vụ: hiển thị các thông tin mà đã từ chối hoặc chấp nhận, đồng thời có 2 nút từ chối và chấp nhận để hiển thị phân loại lịch sử yêu cầu đã xác nhận
Quản lý điểm danh:
- Danh sách điểm danh: giữ nguyên các thuộc tính, bỏ check-out, vắng mặt, có mặt, trạng thái đi, thêm số điện thoại, gói tập, thời gian(thời gian còn lại của gói tập)
- Lịch sử điểm danh: lấy nguyên danh sách bên danh sách điểm danh, lấy input tìm kiếm nữa, trong phần danh sách thì thêm cột số ngày điểm danh trong tháng
Góc giao diện bên cạnh nút về trang chủ, sẽ hiển thị thêm nút icon camera, sau khi click vào đó thì sẽ tự khởi động camera,
Quản lý sản phẩm: 
- danh sách sản phẩm: hiển thị list danh sách các sản phẩm,(các loại nước uống khi vận động) gồm có ảnh, tên sản phẩm, ngày nhập, ngày hết hạn, sửa xoá, có thểm nút nữa, sau khi click vào sẽ hiển thị ô cửa sổ đẻ viết lý do(khai báo hàng hỏng hoặc mất)
- Thêm sản phẩm: dựa vào các thuộc tính của danh sách sản phẩm để thêm 
- Khách trả hàng: list danh sách các lần khách trả hàng, có nút nhập thông tin, click vào đó sẽ có form nhập Tên mặt hàng, lý do khách trả hàng, số lượng hàng Rồi nhấn nút lưu sau đó chuyển về danh sách các lần khách trả hàng
Quản lý Nhân viên: 
- Danh sách nhân viên: Thay chức vụ thành công việc, bỏ bộ phận đi, thêm giới tính, thời gian làm việc ví dụ Ca: sang(6h-12h), chieu(12h-18h), toi(18h-22h), ca ngay, địa chỉ, Bạn xoá cái nút  thêm nhân viên trong giao diện của danh sách đi, có nút thêm ở menu rồi
- Chi tiết lương nhân viên: sẽ list danh sách nhân viên với thuộc tính(họ và tên, công việc, tiền được thưởng, tiền lương, tổng tiền lương, sẽ có nút: cập nhật lương và trả lương) click vào nút cập nhật lương sẽ hiển thị một cửa sổ có đoạn text lương ban đầu và input lương cập nhật, rồi click nút cập nhật, click nút trả lương sẽ thay đổi text và màu từ trả lương thành đã trả, sau một ngày lại reset lại cái nút trả lương đó về ban đầu
-Lịch sử trả lương nhân viên: lấy nguyên danh sách của chi tiết lương, nhưng thay đổi cột cuối từ nút cập nhật và trả lương thành cột đã trả vào ngày
- Thêm nhân viên: bạn update lại nha
- phân quyền: giữ nguyên nha

Quản lý công việc:
-Danh sách công việc: hiển thị Tên công việc, tiền lương, sửa xoá
-Thêm công việc: form nhập với 2 thuộc tính của danh sách công việc

Quản lý thống kê biểu đồ: (hiển thị các tháng trong năm với chỉ số của từng tháng)
Biểu đồ Hội viên đăng ký, 
Biểu đồ Hội viên đang hoạt động, 
biểu đồ doanh thu, 
biểu đồ doanh số theo loại gói(1 tháng, 3 tháng, 5 tháng, 1 năm)
biểu đồ chi phí,
biểu đồ lãi

Quản lý cơ sở phòng tập: 
- danh sách câu lạc bộ: form thông tin có tiêu đề, mô tả, địa chỉ, khung giờ(cụ thể là giờ mở cửa, giờ đóng cửa), số điện thoại
- thêm câu lạc bộ: dựa theo các thuộc tính của danh sách

Quản lý bộ môn: 
- danh sách bộ môn: form thông tin có tiêu đề, mô tả, tiêu đề 2, mô tả chi tiết
- thêm bộ môn: dựa theo các thuộc tính của danh sách
Quản lý chính sách:
- danh sách chính sách: hiển thị các thuộc tính: tiêu đề, mô tả, 
- Thêm chính sách: form 2 thuộc tính của danh sách 






