using WaterProject.API.Models;

namespace WaterProject.API.Repositories;

public interface IBookRepository
{
    Task<PagedBooksResponse> GetBooksAsync(
        int page,
        int pageSize,
        bool sortTitleAscending,
        string? category = null);

    Task<IReadOnlyList<string>> GetCategoriesAsync();

    Task<Book> AddBookAsync(CreateBookDto dto);

    Task<Book?> GetBookByIdAsync(int id);

    Task<Book?> UpdateBookAsync(int id, CreateBookDto dto);

    Task<bool> DeleteBookAsync(int id);
}
