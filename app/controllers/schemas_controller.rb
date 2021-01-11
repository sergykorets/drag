class SchemasController < ApplicationController
  def index
    @admin = Rails.env.development? || (current_user && current_user.admin)
  end

  def skipass
    set_meta_tags title: "Cкіпас | Драгобрат",
                  description: "Ціни на підйомники драгобрат",
                  keywords: "Скіпас підйомники драгобрат ціни"
  end

  def chat
    @user = current_user && {name: current_user.name, id: current_user.id}
  end
end
