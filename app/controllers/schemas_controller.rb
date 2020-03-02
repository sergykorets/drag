class SchemasController < ApplicationController
  def index
    @admin = Rails.env.development? || (current_user && current_user.admin)
  end

  def skipass;  end

  def chat
    @user = current_user && {name: current_user.name, id: current_user.id}
  end
end
