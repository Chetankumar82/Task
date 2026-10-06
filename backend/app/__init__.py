import logging
from flask import Flask, jsonify
from flask_cors import CORS
from app.config import Config

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger(__name__)


def create_app(config_class=Config) -> Flask:
    """Flask application factory."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for Next.js frontend (Bearer token headers allowed across all origins)
    CORS(
        app,
        resources={r"/api/*": {"origins": "*"}},
        allow_headers=["Content-Type", "Authorization", "X-Mock-User-Id"],
        methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"]
    )

    # Register Blueprints
    from app.routes import tasks_bp, users_bp, health_bp
    app.register_blueprint(tasks_bp)
    app.register_blueprint(users_bp)
    app.register_blueprint(health_bp)

    # Global Error Handlers
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify({"error": "Bad Request", "message": str(e)}), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Not Found", "message": "The requested endpoint does not exist."}), 404

    @app.errorhandler(500)
    def server_error(e):
        logger.error("Internal Server Error: %s", e)
        return jsonify({"error": "Internal Server Error", "message": "An unexpected error occurred."}), 500

    @app.route("/")
    def index():
        return jsonify({
            "service": "Hairdrama Tech Task Management API",
            "version": "1.0.0",
            "docs": "/api/health",
            "status": "online"
        }), 200

    from app.routes.health import health_check
    @app.route("/health")
    def root_health():
        return health_check()

    return app
