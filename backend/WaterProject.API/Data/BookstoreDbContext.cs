using Microsoft.EntityFrameworkCore;
using WaterProject.API.Models;

namespace WaterProject.API.Data;

public class BookstoreDbContext(DbContextOptions<BookstoreDbContext> options) : DbContext(options)
{
    public DbSet<Book> Books => Set<Book>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Book>().ToTable("Books");
    }
}
