namespace WaterProject.API.Models;

public class PagedBooksResponse
{
    public List<Book> Books { get; set; } = [];
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}
