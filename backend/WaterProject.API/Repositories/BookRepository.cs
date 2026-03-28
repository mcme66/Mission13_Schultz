using Microsoft.EntityFrameworkCore;
using WaterProject.API.Data;
using WaterProject.API.Models;

namespace WaterProject.API.Repositories;

public class BookRepository(BookstoreDbContext db) : IBookRepository
{
    public async Task<PagedBooksResponse> GetBooksAsync(
        int page,
        int pageSize,
        bool sortTitleAscending,
        string? category = null)
    {
        var query = db.Books.AsQueryable();

        if (!string.IsNullOrWhiteSpace(category))
        {
            var c = category.Trim();
            query = query.Where(b => b.Category == c);
        }

        query = sortTitleAscending ? query.OrderBy(b => b.Title) : query.OrderByDescending(b => b.Title);

        var totalCount = await query.CountAsync();
        var totalPages = totalCount == 0 ? 0 : (int)Math.Ceiling(totalCount / (double)pageSize);

        var safePage = page;
        if (totalPages > 0 && safePage > totalPages)
            safePage = totalPages;
        if (safePage < 1)
            safePage = 1;

        var books = await query
            .Skip((safePage - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedBooksResponse
        {
            Books = books,
            TotalCount = totalCount,
            Page = safePage,
            PageSize = pageSize,
            TotalPages = totalPages
        };
    }

    public async Task<IReadOnlyList<string>> GetCategoriesAsync()
    {
        return await db.Books
            .Select(b => b.Category)
            .Where(c => !string.IsNullOrWhiteSpace(c))
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();
    }

    public async Task<Book> AddBookAsync(CreateBookDto dto)
    {
        var book = new Book
        {
            Title = dto.Title.Trim(),
            Author = dto.Author.Trim(),
            Publisher = dto.Publisher.Trim(),
            ISBN = dto.ISBN.Trim(),
            Classification = dto.Classification.Trim(),
            Category = dto.Category.Trim(),
            PageCount = dto.PageCount,
            Price = dto.Price
        };

        db.Books.Add(book);
        await db.SaveChangesAsync();
        return book;
    }
}
