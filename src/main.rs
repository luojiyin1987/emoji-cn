use actix_web::{get, App, HttpResponse, HttpServer, Result};
use actix_files::Files;
use tera::Tera;

#[get("/")]
async fn index(tera: actix_web::web::Data<Tera>) -> Result<HttpResponse> {
    let context = tera::Context::new();
    let body = tera.render("index.html", &context)
        .map_err(|_| actix_web::error::ErrorInternalServerError("Template error"))?;
    
    Ok(HttpResponse::Ok()
        .content_type("text/html")
        .body(body))
}

#[actix_web::main]
async fn main() -> std::io::Result<()> {
    println!("启动服务器在 http://127.0.0.1:8081");
    
    let tera = match Tera::new("templates/**/*") {
        Ok(t) => t,
        Err(e) => {
            println!("解析模板错误: {}", e);
            std::process::exit(1);
        }
    };

    HttpServer::new(move || {
        App::new()
            .app_data(actix_web::web::Data::new(tera.clone()))
            .service(index)
            .service(Files::new("/static", "static").show_files_listing())
    })
    .bind("0.0.0.0:8081")?
    .run()
    .await
}
