const bangSach = require("../models/sach.model");
const bangLoaiSach = require("../models/loaisach.model");
const bangTacGia = require("../models/tacgia.model");
const bangNXB = require("../models/nhaxuatban.model");
const bangViTri = require("../models/vitri.model");
const bangSachCopy = require("../models/sachCopy.model");
const { patch } = require("../routes/chatbot");

class QueryService {
  // Tìm kiếm sách theo tên
  async searchBooksByName(tenSach) {
    try {
      const books = await bangSach
        .find({
          TenSach: { $regex: tenSach, $options: "i" },
        })
        .select("-image")
        .populate("TacGia", "TenTG")
        .populate("MaLoai", "TenLoai")
        .limit(10);
      return books;
    } catch (error) {
      throw new Error(`Lỗi tìm kiếm sách: ${error.message}`);
    }
  }

  // Tìm kiếm sách theo tác giả
  async searchBooksByAuthor(tenTacGia) {
    try {
      const authors = await bangTacGia.find({
        TenTG: { $regex: tenTacGia, $options: "i" },
      });

      if (authors.length === 0) {
        return [];
      }

      const authorIds = authors.map((author) => author._id);
      const books = await bangSach
        .find({
          TacGia: { $in: authorIds },
        })
        .select("-image")
        .populate("TacGia", "TenTG")
        .populate("MaLoai", "TenLoai")
        .limit(10);

      return books;
    } catch (error) {
      throw new Error(`Lỗi tìm kiếm theo tác giả: ${error.message}`);
    }
  }

  // Tìm kiếm sách theo loại
  async searchBooksByCategory(tenLoai) {
    try {
      const categories = await bangLoaiSach.find({
        TenLoai: { $regex: tenLoai, $options: "i" },
      });
      console.log("💡 Kết quả tìm thể loại:", categories);
      if (categories.length === 0) {
        return [];
      }

      const categoryIds = categories.map((cat) => cat._id);
      const books = await bangSach
        .find({
          MaLoai: { $in: categoryIds },
        })
        .select("-image")
        .populate("TacGia", "TenTG")
        .populate("MaLoai", "TenLoai")
        .limit(10);

      return books;
    } catch (error) {
      throw new Error(`Lỗi tìm kiếm theo loại: ${error.message}`);
    }
  }

  // Lấy thông tin chi tiết sách
  async getBookDetails(maSach) {
    try {
      const book = await bangSach
        .findOne({ MaSach: maSach })
        .select("-image")
        .populate("TacGia", "TenTG MoTa")
        .populate("MaLoai", "TenLoai MoTa");

      if (!book) {
        return null;
      }

      const copies = await bangSachCopy
        .find({ MaSach: book._id })
        .populate("MaNXB", "TenNXB DiaChi")
        .populate("MaViTri", "TenViTri MoTa")
        .populate("MaSach");
      return { book, copies };
    } catch (error) {
      throw new Error(`Lỗi lấy thông tin sách: ${error.message}`);
    }
  }
  // nhà xuất bản
  //   async searchBooksByPublisher(publisherName) {
  //     const publisher = await bangNXB.findOne({
  //       TenNXB: { $regex: new RegExp(publisherName, "i") },
  //     });

  //     if (!publisher) return [];

  //     const books = await bangSachCopy.find({ MaNXB: publisher._id }).populate([
  //       {
  //         path: "MaSach",
  //         populate: [
  //           { path: "TacGia" },
  //           {
  //             path: "MaLoai",
  //           },
  //         ],
  //       },
  //       {
  //         path: "MaNXB",
  //       },
  //       {
  //         path: "MaViTri",
  //       },
  //     ]);
  //     return books;
  //   }
  async searchBooksByPublisher(publisherName) {
    const publisher = await bangNXB.findOne({
      TenNXB: { $regex: new RegExp(publisherName, "i") },
    });

    if (!publisher) return [];

    const copies = await bangSachCopy.find({ MaNXB: publisher._id }).populate([
      {
        path: "MaSach",
        populate: [{ path: "TacGia" }, { path: "MaLoai" }],
      },
      {
        path: "MaNXB",
      },
      {
        path: "MaViTri",
      },
    ]);

    // Tạo danh sách định dạng đẹp
    const formattedBooks = copies
      .filter((copy) => copy.MaSach) // đảm bảo sách gốc tồn tại
      .map((copy) => {
        const book = copy.MaSach;
        const tenTacGia = (book.TacGia || []).map((tg) => tg.TenTG).join(", ");
        const theLoai = (book.MaLoai || []).map((tl) => tl.TenLoai).join(", ");

        return {
          MaSach: book.MaSach,
          TenSach: book.TenSach,
          NamXuatBan: book.NamXuatBan,
          SoLuotMuon: book.SoLuotMuon || 0,
          MoTa: book.MoTa || "Không có mô tả",
          TacGia: tenTacGia || "Không rõ",
          TheLoai: theLoai || "Không rõ",
          TenLoaiBanSao: copy.TenLoaiBanSao,
          NhaXuatBan: copy.MaNXB?.TenNXB || "Không rõ",
          ViTri: copy.MaViTri?.TenViTri || "Không rõ",
          SoQuyen: copy.SoQuyen,
        };
      });

    return formattedBooks;
  }

  // Kiểm tra tình trạng sách
  async checkBookAvailability(maSach) {
    try {
      const book = await bangSach.findOne({ MaSach: maSach }).select("-image");
      if (!book) {
        return null;
      }

      const copies = await bangSachCopy
        .find({ MaSach: book._id })
        .populate("MaSach");
      const totalCopies = copies.reduce((sum, copy) => sum + copy.SoQuyen, 0);
      const borrowedCopies = copies.reduce(
        (sum, copy) => sum + copy.SoLuongDaMuon,
        0
      );
      const availableCopies = totalCopies - borrowedCopies;

      return {
        book,
        totalCopies,
        borrowedCopies,
        availableCopies,
        isAvailable: availableCopies > 0,
      };
    } catch (error) {
      throw new Error(`Lỗi kiểm tra tình trạng sách: ${error.message}`);
    }
  }

  // Lấy danh sách sách phổ biến
  async getPopularBooks(limit = 10) {
    try {
      const books = await bangSach
        .find()
        .select("-image")
        .sort({ SoLuotMuon: -1 })
        .limit(limit)
        .populate("TacGia", "TenTG")
        .populate("MaLoai", "TenLoai");

      return books;
    } catch (error) {
      throw new Error(`Lỗi lấy sách phổ biến: ${error.message}`);
    }
  }

  // Lấy thống kê thư viện
  async getLibraryStats() {
    try {
      const totalBooks = await bangSach.countDocuments();
      const totalAuthors = await bangTacGia.countDocuments();
      const totalCategories = await bangLoaiSach.countDocuments();
      const totalPublishers = await bangNXB.countDocuments();
      const totalCopies = await bangSachCopy.aggregate([
        { $group: { _id: null, total: { $sum: "$SoQuyen" } } },
      ]);

      return {
        totalBooks,
        totalAuthors,
        totalCategories,
        totalPublishers,
        totalCopies: totalCopies[0]?.total || 0,
      };
    } catch (error) {
      throw new Error(`Lỗi lấy thống kê: ${error.message}`);
    }
  }
}

module.exports = new QueryService();
