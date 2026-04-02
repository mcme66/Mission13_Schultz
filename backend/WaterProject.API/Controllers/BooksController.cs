using Microsoft.AspNetCore.Mvc;
using WaterProject.API.Models;
using WaterProject.API.Repositories;

namespace WaterProject.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class BooksController(IBookRepository books) : ControllerBase
{
    /// <summary>
    /// Distinct book categories for filtering (ordered A→Z).
    /// </summary>
    [HttpGet("categories")]
    public async Task<IActionResult> GetCategories()
    {
        var list = await books.GetCategoriesAsync();
        return Ok(list);
    }

    /// <summary>
    /// Returns paginated books. Default: page 1, 5 per page, title A→Z.
    /// Optional category filters to that exact category string.
    /// </summary>
    [HttpGet]
    public async Task<IActionResult> GetBooks(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 5,
        [FromQuery] string sortOrder = "asc",
        [FromQuery] string? category = null)
    {
        if (page < 1 || pageSize < 1 || pageSize > 50)
            return BadRequest("page must be >= 1, pageSize between 1 and 50.");

        var ascending = !string.Equals(sortOrder, "desc", StringComparison.OrdinalIgnoreCase);

        var result = await books.GetBooksAsync(page, pageSize, ascending, category);
        return Ok(result);
    }

    /// <summary>
    /// Returns a single book by id.
    /// </summary>
    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetBookById([FromRoute] int id)
    {
        var book = await books.GetBookByIdAsync(id);
        if (book is null) return NotFound();
        return Ok(book);
    }

    /// <summary>
    /// Adds a new book. All fields are required and validated.
    /// </summary>
    [HttpPost]
    public async Task<IActionResult> CreateBook([FromBody] CreateBookDto dto)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var book = await books.AddBookAsync(dto);
        return StatusCode(StatusCodes.Status201Created, book);
    }

    /// <summary>
    /// Updates an existing book by id. All fields are required and validated.
    /// </summary>
    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateBook([FromRoute] int id, [FromBody] CreateBookDto dto)
    {
        if (!ModelState.IsValid)
            return ValidationProblem(ModelState);

        var updated = await books.UpdateBookAsync(id, dto);
        if (updated is null) return NotFound();
        return Ok(updated);
    }

    /// <summary>
    /// Deletes a book by id.
    /// </summary>
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteBook([FromRoute] int id)
    {
        var ok = await books.DeleteBookAsync(id);
        if (!ok) return NotFound();
        return NoContent();
    }
}
