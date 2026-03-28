using System.ComponentModel.DataAnnotations;

namespace WaterProject.API.Models;

public class CreateBookDto
{
    [Required(ErrorMessage = "Title is required.")]
    [StringLength(500, MinimumLength = 1, ErrorMessage = "Title must be 1–500 characters.")]
    public string Title { get; set; } = string.Empty;

    [Required(ErrorMessage = "Author is required.")]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Author must be 1–200 characters.")]
    public string Author { get; set; } = string.Empty;

    [Required(ErrorMessage = "Publisher is required.")]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "Publisher must be 1–200 characters.")]
    public string Publisher { get; set; } = string.Empty;

    [Required(ErrorMessage = "ISBN is required.")]
    [StringLength(32, MinimumLength = 10, ErrorMessage = "ISBN must be at least 10 characters.")]
    [RegularExpression(@"^[\d\-Xx]+$", ErrorMessage = "ISBN may only contain digits, hyphens, or X.")]
    public string ISBN { get; set; } = string.Empty;

    [Required(ErrorMessage = "Classification is required.")]
    [StringLength(100, MinimumLength = 1)]
    public string Classification { get; set; } = string.Empty;

    [Required(ErrorMessage = "Category is required.")]
    [StringLength(100, MinimumLength = 1)]
    public string Category { get; set; } = string.Empty;

    [Required]
    [Range(1, 1_000_000, ErrorMessage = "Page count must be between 1 and 1,000,000.")]
    public int PageCount { get; set; }

    [Required]
    [Range(0.01, 1_000_000, ErrorMessage = "Price must be between $0.01 and $1,000,000.")]
    public double Price { get; set; }
}
