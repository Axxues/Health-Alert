using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealthAlert.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddThresholdMethods : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Citation",
                table: "tblRiskThresholds",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Method",
                table: "tblRiskThresholds",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Citation",
                table: "tblRiskThresholds");

            migrationBuilder.DropColumn(
                name: "Method",
                table: "tblRiskThresholds");
        }
    }
}
