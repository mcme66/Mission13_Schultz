using Microsoft.EntityFrameworkCore;
using WaterProject.API.Data;
using WaterProject.API.Repositories;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();

var connectionString = builder.Configuration.GetConnectionString("BookstoreConnection")
    ?? "Data Source=Bookstore.sqlite";

builder.Services.AddDbContext<BookstoreDbContext>(options =>
    options.UseSqlite(connectionString));

builder.Services.AddScoped<IBookRepository, BookRepository>();

var corsPolicy = "FrontendDev";
builder.Services.AddCors(options =>
{
    options.AddPolicy(corsPolicy, policy =>
    {
        var allowedOrigins = new List<string>
        {
            "http://localhost:5173",
            "http://127.0.0.1:5173"
        };

        var extraOrigins = builder.Configuration["CORS_ALLOWED_ORIGINS"];
        if (!string.IsNullOrWhiteSpace(extraOrigins))
        {
            allowedOrigins.AddRange(
                extraOrigins
                    .Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries)
            );
        }

        policy
            .WithOrigins(allowedOrigins.Distinct(StringComparer.OrdinalIgnoreCase).ToArray())
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseCors(corsPolicy);
app.UseAuthorization();
app.MapControllers();

app.Run();
