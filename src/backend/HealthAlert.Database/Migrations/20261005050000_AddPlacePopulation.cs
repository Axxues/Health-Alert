using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealthAlert.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddPlacePopulation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblPlacePopulation",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Province = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Municipality = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Barangay = table.Column<string>(type: "nvarchar(450)", nullable: true),
                    Population = table.Column<long>(type: "bigint", nullable: false),
                    RefYear = table.Column<int>(type: "int", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UploadedBy = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblPlacePopulation", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_tblPlacePopulation_Province_Municipality_Barangay_RefYear",
                table: "tblPlacePopulation",
                columns: new[] { "Province", "Municipality", "Barangay", "RefYear" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblPlacePopulation");
        }
    }
}
