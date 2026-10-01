using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace HealthAlert.Database.Migrations
{
    /// <inheritdoc />
    public partial class AddRiskThresholds : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "tblRiskThresholds",
                columns: table => new
                {
                    Id = table.Column<long>(type: "bigint", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Disease = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    HighProb = table.Column<double>(type: "float", nullable: false),
                    WatchProb = table.Column<double>(type: "float", nullable: false),
                    VelocityHigh = table.Column<double>(type: "float", nullable: false),
                    VelocityWatch = table.Column<double>(type: "float", nullable: false),
                    CovariateKey = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CovariateHigh = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_tblRiskThresholds", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "tblRiskThresholds");
        }
    }
}
