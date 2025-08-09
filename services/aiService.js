// module.exports = new AIService();
const openai = require("../configs/openai");
const queryService = require("./queryService");

class AIService {
  // Bổ sung url
  addBookUrls(data) {
    const baseURL = "http://localhost:5173/book/";

    const makeLink = (maSach) => {
      // Thay đổi từ <a> tag sang data attribute để Vue xử lý
      return `👉 <span class="detail-link" data-book-id="${maSach}">Xem chi tiết</span>`;
    };

    if (Array.isArray(data)) {
      return data.map((book) => ({
        ...book,
        url: `${baseURL}${book.MaSach}`,
        detailLink: makeLink(book.MaSach),
      }));
    } else if (data && data.book) {
      return {
        ...data,
        book: {
          ...data.book,
          url: `${baseURL}${data.book.MaSach}`,
          detailLink: makeLink(data.book.MaSach),
        },
      };
    } else if (data && data.MaSach) {
      return {
        ...data,
        url: `${baseURL}${data.MaSach}`,
        detailLink: makeLink(data.MaSach),
      };
    }

    return data;
  }

  async processUserQuery(userMessage, historyContext = []) {
    try {
      const intent = await this.analyzeIntent(userMessage, historyContext);

      let data = await this.executeQuery(intent, userMessage);

      // ... phần còn lại của hàm giữ nguyên
      data = await this.addBookUrls(data);

      const response = await this.generateResponse(
        intent,
        data,
        userMessage,
        historyContext
      );

      return response;
    } catch (error) {
      console.error("Lỗi xử lý query:", error);
      return "Xin lỗi, tôi không thể xử lý câu hỏi này. Vui lòng thử lại.";
    }
  }
  async analyzeIntent(userMessage, historyContext = []) {
    const formattedHistory = historyContext
      .map((item) => `${item.role}: ${item.content}`)
      .join("\n");

    const prompt = `
Bạn là một AI chuyên phân tích ý định người dùng cho một chatbot thư viện.
Nhiệm vụ của bạn là phân tích **câu hỏi mới nhất của người dùng** dựa vào **lịch sử trò chuyện** để xác định chính xác ý định (intent) và các thực thể (entities).

---
**LỊCH SỬ TRÒ CHUYỆN (nếu có):**
${formattedHistory}
---
**CÂU HỎI MỚI NHẤT CỦA NGƯỜI DÙNG:**
"${userMessage}"
---

**HƯỚNG DẪN VÀ CÁC LOẠI INTENT:**

*   **search_book**: Tìm kiếm chung chung theo tên sách hoặc chủ đề.
    *   Ví dụ: "tìm sách Chí Phèo", "sách về AI"
    *   Entities: { "book_name": "..." }

*   **search_author**: Tìm sách của một tác giả cụ thể.
    *   Ví dụ: "sách của Nam Cao", "tác phẩm của Tô Hoài"
    *   Entities: { "author_name": "..." }
    
*   **search_year**: Tìm sách theo năm xuất bản.
    *   Ví dụ: "các sách xuất bản năm 2020", "năm xuất bản 2017 có sách nào"
    *   Entities: { "publisher_year": "..." }
  
*   **search_category**: Tìm sách thuộc một thể loại cụ thể. **LUÔN ƯU TIÊN INTENT NÀY KHI THẤY CÁC TỪ KHÓA "THỂ LOẠI", "LOẠI", "TRUYỆN", "SÁCH ... HỌC".**
    *   Ví dụ: "tìm sách thể loại văn học", "có truyện tranh không?", "sách khoa học", "tiểu thuyết"
    *   Entities: { "category_name": "..." }

*   **search_publisher**: Tìm sách của một nhà xuất bản cụ thể. **LUÔN ƯU TIÊN INTENT NÀY KHI THẤY "NXB", "NHÀ XUẤT BẢN", "XUẤT BẢN".**
    *   Ví dụ: "sách của nhà xuất bản Kim Đồng", "NXB Trẻ có sách gì hay?"
    *   Entities: { "publisher_name": "..." }

*   **popular_books**: Tìm các sách phổ biến. **LUÔN ƯU TIÊN INTENT NÀY KHI THẤY "SÁCH PHỔ BIẾN", "SÁCH HOT", "SÁCH MƯỢN NHIỀU NHẤT".**
    *   Ví dụ: "sách phổ biến của thư viên", "những quyển sách hot nhất?"
    *   Entities: { "popular_books": "..." }
    
*   **book_details**: Hỏi thông tin chi tiết về một cuốn sách đã được đề cập.
    *   Ví dụ (sau khi bot trả lời về sách 'Kim Đồng'): "nó của tác giả nào?", "tác giả là ai?" "thông tin chi tiết", "của nhà xuất bản nào?"
    *   Suy luận từ ngữ cảnh để điền 'book_name'.
    *   Entities: { "book_name": "..." }

*   **library_statistics**: Hỏi về các số liệu thống kê của thư viện.
    *   Ví dụ: "thống kê thư viện", "có bao nhiêu sách?"

**QUY TẮC SUY LUẬN:**
1.  Nếu câu hỏi của người dùng khớp chính xác với một ví dụ của intent nào, hãy chọn intent đó.
2.  Phải trích xuất được thực thể tương ứng (ví dụ: 'văn học' là 'category_name').

**YÊU CẦU ĐẦU RA:**
Trả về một đối tượng JSON duy nhất, không thêm giải thích.
Format JSON:
{
  "intent": "tên_intent_đã_chọn",
  "entities": {
    "book_name": "tên sách nếu có",
    "author_name": "tên tác giả nếu có",
    "category_name": "tên thể loại nếu có",
    "publisher_name": "tên NXB nếu có",
    "publisher_year": "năm xuất bản nếu có",
    "popular_books": "sách phổ biến nếu có"
  }
}
`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    try {
      const result = JSON.parse(response.choices[0].message.content);
      console.log("Contextual Intent Analysis Result:", result);
      return result;
    } catch (error) {
      console.error("Contextual Intent Parsing Error:", error);
      return {
        intent: "general_info",
        entities: {},
        confidence: 0.5,
      };
    }
  }
  async executeQuery(intent, userMessage) {
    console.log(
      "🕵️‍♂️ Đang thực thi Query với Intent:",
      JSON.stringify(intent, null, 2)
    );
    const { entities } = intent;

    switch (intent.intent) {
      case "search_book":
        if (entities.book_name) {
          return await queryService.searchBooksByName(entities.book_name);
        }
        break;
      case "search_publisher":
        if (entities.publisher_name) {
          return await queryService.searchBooksByPublisher(
            entities.publisher_name
          );
        }
        break;
      case "search_year":
        if (entities.publisher_year) {
          return await queryService.searchBooksByYear(entities.publisher_year);
        }
        break;
      case "search_author":
        if (entities.author_name) {
          return await queryService.searchBooksByAuthor(entities.author_name);
        }
        break;

      case "search_category":
        if (entities.category_name) {
          return await queryService.searchBooksByCategory(
            entities.category_name
          );
        }
        break;

      case "book_details":
        if (entities.book_code) {
          return await queryService.getBookDetails(entities.book_code);
        }
        // ✅ THÊM LOGIC MỚI: Nếu không có mã, tìm chi tiết bằng tên sách
        if (entities.book_name) {
          // searchBooksByName trả về một mảng, chúng ta có thể trả về cả mảng
          // để generateResponse xử lý (vì nó đã được code để xử lý mảng)
          const results = await queryService.searchBooksByName(
            entities.book_name
          );
          return results && results.length > 0 ? results : null;
        }
        break;

      case "book_availability":
        if (entities.book_code) {
          return await queryService.checkBookAvailability(entities.book_code);
        }
        break;

      case "popular_books":
        return await queryService.getPopularBooks();

      case "library_statistics":
        return await queryService.getLibraryStats();

      default:
        return null;
    }

    return null;
  }

  async generateResponse(intent, data, userMessage, historyContext = []) {
    //  ĐOẠN CODE XỬ LÝ RIÊNG CHO THỐNG KÊ
    console.log(data);
    if (intent.intent === "library_statistics" && data) {
      const reply = `
📊 Dưới đây là một vài số liệu thống kê thú vị về thư viện của chúng ta:
<br><br>
- 📚 <strong>Tổng số đầu sách:</strong> ${data.totalBooks}
<br>
- ✍️ <strong>Tổng số tác giả:</strong> ${data.totalAuthors}
<br>
- 🗂️ <strong>Tổng số thể loại:</strong> ${data.totalCategories}
<br>
- 🏢 <strong>Tổng số nhà xuất bản:</strong> ${data.totalPublishers}
<br>
- 📖 <strong>Tổng số bản sao (quyển):</strong> ${data.totalCopies}
<br><br>
✨ Thật tuyệt vời phải không! Bạn có muốn tìm những cuốn sách phổ biến nhất không?
`;
      return reply;
    }
    if (
      intent.intent === "search_publisher" &&
      data &&
      Array.isArray(data) &&
      data.length > 0 &&
      data[0].TenSach
    ) {
      // Dữ liệu là từ formattedBooks (ví dụ tìm theo nhà xuất bản)
      const reply = data
        .map((book, idx) => {
          return `${idx + 1}. <strong>${book.TenSach}</strong><br>
- <strong>Năm xuất bản:</strong> ${book.NamXuatBan}<br>
- <strong>Số lượt mượn:</strong> ${book.SoLuotMuon} lượt<br>
- <strong>Tác giả:</strong> ${book.TacGia}<br>
- <strong>Thể loại:</strong> ${book.TheLoai}<br>
- <strong>Mô tả:</strong> ${book.MoTa}<br>
- <strong>Nhà xuất bản:</strong> ${book.NhaXuatBan}<br>
- <strong>Tên loại bản sau:</strong> ${book.TenLoaiBanSao}<br>
- <strong>Vị trí:</strong> ${book.ViTri}<br><br>  ${book.detailLink}<br><br>`;
        })
        .join("");

      return `📚 Dưới đây là một số sách của nhà xuất bản ${data[0].NhaXuatBan} mà thư viện có trong bộ sưu tập:<br><br>${reply}`;
    }

    if (data && Array.isArray(data) && data.length > 0) {
      // Trường hợp nhiều sách
      const reply = data
        .map((book, idx) => {
          const tenTacGia =
            book._doc.TacGia?.map((tg) => tg.TenTG).join(", ") || "Không rõ";
          const tenTheLoai =
            book._doc.MaLoai?.map((loai) => loai.TenLoai).join(", ") ||
            "Không rõ";

          return `${idx + 1}. <strong>Tác phẩm: ${
            book._doc.TenSach
          }</strong><br>- <strong>Năm xuất bản:</strong> ${
            book._doc.NamXuatBan
          }<br>- <strong>Số lượt mượn:</strong> ${
            book._doc.SoLuotMuon || 0
          } lượt<br>
      <strong>- Tác giả:</strong> ${tenTacGia}<br>
      <strong>- Thể loại:</strong> ${tenTheLoai}<br>
      <strong>- Mô tả:</strong> ${book._doc.MoTa || "Không có mô tả"}<br>
      ${book.detailLink}<br><br>`;
        })
        .join("");
      return `📚 Dưới đây là danh sách sách:<br><br>${reply}`;
    }
    //////
    let context = "";

    if (data && Array.isArray(data) && data.length > 0) {
      context = `Dữ liệu tìm được: ${JSON.stringify(data, null, 2)}`;
    } else if (data && typeof data === "object") {
      context = `Dữ liệu tìm được: ${JSON.stringify(data, null, 2)}`;
    } else {
      context = "Không tìm thấy dữ liệu phù hợp.";
    }

    const systemPrompt = `
Bạn là trợ lý AI thư viện, nói tiếng Việt thân thiện và hữu ích.

QUY TẮC XỬ LÝ:
1. Có dữ liệu sách: Luôn dùng field "detailLink" có sẵn, không tự tạo link
2. Không tìm thấy dữ liệu cụ thể: 
   - Tìm sách theo tên: "Không tìm thấy sách này. Bạn có thể thử tìm với từ khóa khác hoặc kiểm tra chính tả"
   - Tìm theo tác giả: "Không tìm thấy tác giả này. Bạn có thể thử tên đầy đủ hoặc tác giả khác"
   - Tìm theo thể loại: "Hiện tại chưa có sách thuộc thể loại này. Bạn có thể thử tìm: [gợi ý thể loại tương tự]"
3. Luôn khuyến khích tìm kiếm thêm và đưa ra gợi ý cụ thể
4. Nếu người dùng chào tạm biệt hãy chúc họ một ngày tốt lành, vui vẻ, hạnh phúc,....

PHONG CÁCH:
- Thân thiện, nhiệt tình
- Sử dụng emoji: 📚, 🔍, ✨, 💡
- Đưa ra gợi ý tìm kiếm cụ thể
- Không đề cập đến "trang web bán sách" hay "cửa hàng sách" (đây là hệ thống thư viện)

VÍ DỤ KHI KHÔNG TÌM THẤY:
"🔍 Không tìm thấy sách thiếu nhi trong thư viện. Bạn có thể thử tìm:
- Sách của tác giả nổi tiếng như Nguyễn Nhật Ánh
- Truyện cổ tích Việt Nam
- Sách học tập cho trẻ em
💡 Hoặc thử từ khóa khác như 'truyện tranh', 'sách giáo dục' nhé!"
`;
    const messages = [
      { role: "system", content: systemPrompt },
      ...historyContext,
      { role: "user", content: userMessage },
      { role: "system", content: `Dữ liệu: ${context}` },
    ];

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0].message.content;
  }
}

module.exports = new AIService();
