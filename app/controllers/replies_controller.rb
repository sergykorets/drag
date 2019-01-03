class RepliesController < ApplicationController
  include ApplicationHelper
  before_action :authenticate_user!, only: [:destroy, :create]
  before_action :define_hotel
  before_action :set_reply, only: :destroy

  def create
    @reply = Reply.new(reply_params)
    @reply.repliable_type = params[:reply][:google] == 'true' ? 'GoogleReview' : 'Review'
    @reply.user_id = current_user.try(:id)
    if (current_user.admin || current_user == @hotel.user) && @reply.save
      update_hotel_rating(@hotel)
      render json: {success: true}
    else
      render json: {success: false}
    end
  end

  def destroy
    @reply.destroy if current_user.id == @reply.user_id
    update_hotel_rating(@hotel)
    if @reply.destroyed?
      render json: {success: true}
    else
      render json: {success: false}
    end
  end

  private
  # Use callbacks to share common setup or constraints between actions.
  def set_reply
    @reply = Reply.find(params[:id])
  end

  def define_hotel
    @hotel = Hotel.friendly.find(params[:hotel_id])
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def reply_params
    params.require(:reply).permit(:body, :repliable_id)
  end
end
