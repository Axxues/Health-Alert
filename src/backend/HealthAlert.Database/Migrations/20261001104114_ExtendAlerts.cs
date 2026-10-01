using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealthAlert.Database.Migrations
{
    /// <inheritdoc />
    public partial class ExtendAlerts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Disease",
                table: "tblAlerts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Kind",
                table: "tblAlerts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Muni",
                table: "tblAlerts",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PlaybookCode",
                table: "tblAlerts",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Disease",
                table: "tblAlerts");

            migrationBuilder.DropColumn(
                name: "Kind",
                table: "tblAlerts");

            migrationBuilder.DropColumn(
                name: "Muni",
                table: "tblAlerts");

            migrationBuilder.DropColumn(
                name: "PlaybookCode",
                table: "tblAlerts");
        }
    }
}
