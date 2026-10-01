using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealthAlert.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddForecastModels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblForecastModels",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Disease = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Version = table.Column<int>(type: "int", nullable: false),
                    CoeffsJson = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    TrainedFrom = table.Column<DateTime>(type: "datetime2", nullable: true),
                    TrainedTo = table.Column<DateTime>(type: "datetime2", nullable: true),
                    Rmse = table.Column<double>(type: "float", nullable: true),
                    Mae = table.Column<double>(type: "float", nullable: true),
                    R2 = table.Column<double>(type: "float", nullable: true),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblForecastModels", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblForecastModels");
        }
    }
}
