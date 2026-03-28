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
        policy.WithOrigins("http://localhost:5173", "http://127.0.0.1:5173")
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
